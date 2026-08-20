# GestionDocumental

Sistema de gestión documental (tipo gestor de archivos corporativo) con carpetas jerárquicas, versionado de documentos, permisos por archivo, papelera de reciclaje y administración de usuarios con roles.

- **Backend**: Node.js 16 + Express + `mysql2` (callbacks/promises manuales, sin ORM).
- **Frontend**: Angular 16 + Angular Material.
- **Base de datos**: MySQL 8 (usa CTEs recursivas — requiere MySQL 8.0+).
- **Despliegue**: Docker Compose + GitHub Actions (self-hosted runner) → VPS con Apache como reverse proxy TLS.

---

## 1. Arquitectura y estructura del proyecto

```
backend/
  src/
    app.js                 # Setup de Express, CORS, montaje de rutas
    connections/mysql.js    # Pool mysql2 (charset utf8mb4 explícito)
    controllers/            # Un archivo por recurso (user, folder, file, permission, trash)
    services/                # Acceso a datos (queries SQL crudas vía el pool)
    middlewares/             # authVerify, requireLevel, loginRateLimit
    routes/                  # Un router por recurso, montado en app.js
    utils/                   # roles.js, validate.js, multerConfig.js
  index.js                  # Entry point (require('./src/app'))
frontend/
  src/app/src/
    admin/                   # Login, administración de usuarios, cambio forzado de password
    dashboard/                # Layout principal, workplace (explorador), diálogos, header
    services/                 # HttpClient wrappers + estado compartido (BehaviorSubject)
    interfaces/                # Tipos TypeScript
    guards/                    # is-admin.guard.ts
    interceptors/               # auth.service.ts (maneja 401/403 globalmente)
init/                        # Scripts SQL, ejecutados en orden alfabético SOLO en un volumen MySQL vacío
docker-compose.yml           # mysql + backend + frontend
.github/workflows/deploy.yml # CI/CD hacia el runner self-hosted
```

### Flujo de una request típica
`Angular (HttpClient)` → `interceptors/auth.service.ts` (agrega el JWT, maneja 401) → `backend/src/app.js` → `router` → `authVerify` (valida JWT + `isActive`, setea `req.user_id`/`req.accessLevel`) → `controller` (valida rol/ACL) → `service` (SQL) → `mysql2 pool` → MySQL.

---

## 2. Modelo de datos

Definido en `init/01_schema.sql` + migraciones incrementales (`init/02_*.sql` en adelante). Tablas activas:

| Tabla | Propósito |
|---|---|
| `users` | Cuentas, `accessLevel` (rol), `isActive`, `must_change_password`, `last_login` |
| `folders` | Árbol de carpetas (`parent_folder_id` auto-referenciado), `description`, soft-delete vía `isDelete` |
| `files` | Identidad lógica de un documento (`name`+`extname` fijos desde la creación); el contenido real vive en `file_versions` |
| `file_versions` | Cada versión subida de un archivo; `is_active` marca la versión vigente |
| `permissions` | ACL por archivo o carpeta (`can_read`/`can_write`/`can_delete`), por `user_id` |
| `file_history` | Auditoría de acciones sobre archivos (creación, actualización, descarga) |

**Tablas presentes en el esquema pero sin uso actual** (reservadas, ningún controller/service las consulta): `trash`, `tags`, `file_tags`. La papelera real se implementa con el flag `isDelete` directamente sobre `files`/`folders`, no con la tabla `trash`.

### Soft-delete
Ninguna operación de borrado hace `DELETE`. Se marca `isDelete = 1` (`deleteLogic()` en cada servicio). Esto evita romper claves foráneas (`files.folder_id`, `permissions.file_id`, `file_history.file_id`, etc.) y permite la papelera/restauración. Todas las lecturas filtran `WHERE isDelete = 0`.

---

## 3. Autenticación y modelo de roles

### JWT
Login (`POST /users/login`) devuelve un JWT (`jsonwebtoken`, HS256, 8h de expiración) firmado con `process.env.SECRET`, con payload `{ user_id, username, email, accessLevel, must_change_password }`. El middleware `authVerify` (`backend/src/middlewares/authVerify.js`) corre en **cada** request autenticada: valida el JWT y **además** vuelve a consultar `isActive` en base de datos — así, desactivar un usuario invalida su sesión en la siguiente request, sin esperar a que expire el token.

Rate limiting en memoria (`loginRateLimit.js`): 5 intentos fallidos por IP+usuario bloquean el login 15 minutos.

### Los 5 niveles de rol (`backend/src/utils/roles.js`)

A **menor** número, **mayor** privilegio (`isAtLeast(level, required) = level <= required`):

| Valor | Rol | Puede |
|---|---|---|
| 0 | `ADMIN` | Todo lo de abajo + administración de usuarios (`/admin/usuarios`) + **bypass total de la ACL de archivos** (lee/escribe/borra cualquier archivo sin que se lo compartan) |
| 1 | `SUPERVISOR` | Crear/editar/mover/eliminar carpetas y archivos + acceso a papelera |
| 2 | `GESTOR` | Igual que SUPERVISOR (es el umbral mínimo para la papelera) |
| 3 | `EDITOR` | Crear/editar/mover/eliminar carpetas y archivos, **sin** acceso a papelera |
| 4 | `LECTOR` | Solo lectura — no puede crear, subir, editar ni mover nada |

### Dos ejes de control independientes
1. **Rol (`accessLevel`)**: gobierna operaciones estructurales (crear/mover/eliminar carpetas y archivos, papelera, admin de usuarios). Se valida con `isAtLeast()` en el controller.
2. **ACL por archivo** (tabla `permissions`): gobierna lectura/escritura/borrado de un archivo **específico**. Al subir un archivo, solo el creador recibe `can_read/write/delete = 1`; para que otro usuario lo vea, el creador (o quien tenga `can_write`) debe compartirlo explícitamente (botón "Permisos"). `ADMIN` es la única excepción con bypass automático.

**Decisión de diseño intencional**: listar/navegar el contenido de una carpeta (`GET /folders/:id/contents`) **no** valida ACL — cualquier usuario autenticado puede ver la estructura de carpetas y nombres de archivos (no así el contenido real: descargar/ver sí exige ACL o rol ADMIN). Es un modelo de "navegación abierta, contenido protegido", decidido explícitamente en lugar de cerrarlo — no es un descuido.

### Control de nombres duplicados
Una carpeta padre no puede tener dos hijos del **mismo tipo** con el mismo nombre (`existsFolderName()` en `folder.service.js`, y `searchFileByFolder()` para archivos, comparando nombre+extensión). Se valida en creación, renombrado y movimiento. Carpeta vs. archivo **sí pueden** compartir nombre (decisión explícita, no se comparan entre tipos), y el mismo nombre en padres distintos siempre está permitido.

---

## 4. Decisiones técnicas relevantes (y por qué)

| Decisión | Motivo |
|---|---|
| Soft-delete (`isDelete`) en vez de `DELETE` | Evita romper FKs entre `files`/`folders`/`permissions`/`file_history`; habilita la papelera |
| `authVerify` re-consulta `isActive` en cada request | Un JWT firmado no puede revocarse; sin esto, desactivar un usuario no tendría efecto hasta que expire el token (8h) |
| Migraciones numeradas en `init/` en vez de un ORM con migrator | El proyecto no usa ORM; se optó por scripts SQL idempotentes con guardas `INFORMATION_SCHEMA`, ver sección 6 |
| `charset: 'utf8mb4'` explícito en el pool de `mysql2` | Sin esto, `mysql2` negocia `latin1` por defecto contra una base `utf8mb4`, corrompiendo tildes/ñ en nombres de archivo (bug real encontrado y corregido — ver `backend/src/connections/mysql.js`) |
| `file_history.action` es `VARCHAR(50)`, no `ENUM` | El ENUM original con literales acentuados (`'CREACIÓN'`, etc.) quedó con bytes corruptos en producción por doble-codificación (UTF-8 reinterpretado como Windows-1252) desde su creación; un ENUM exige match exacto de bytes, así que **ningún** valor generado correctamente por la app podía insertarse. Se optó por VARCHAR porque no depende de un match exacto contra una lista fija |
| `name:` explícito en `docker-compose.yml` (proyecto Compose fijo) | El runner de GitHub Actions hace checkout en una ruta distinta a la instalación manual original; sin fijar el nombre de proyecto, cada deploy generaba volúmenes/red nuevos y vacíos en vez de reutilizar los existentes |
| ACL de archivos independiente del rol, con bypass solo para ADMIN | Permite compartir documentos sensibles de forma explícita entre roles intermedios, sin que cualquier EDITOR/GESTOR pueda ver todo; ADMIN mantiene visibilidad total para soporte/auditoría |
| Rate limiting de login en memoria (no Redis) | Escala suficiente para el volumen de uso actual (una sola instancia de backend); si se escala horizontalmente habría que moverlo a un store compartido |

---

## 5. Desarrollo local

### Requisitos
- Docker + Docker Compose.
- Node 16+ (para correr `backend`/`frontend` fuera de Docker si se prefiere).

### Levantar todo el stack
```bash
docker compose up -d --build
```
Por defecto usa credenciales de desarrollo (`gesdoc`/`gesdocpwd`, `rootpwd`) definidas como fallback en `docker-compose.yml` — no requiere `.env` para uso local. **Excepción**: `SECRET` es obligatorio (`${SECRET:?...}`), debe definirse en un `.env` en la raíz del proyecto aunque sea solo para desarrollo:
```env
SECRET=cualquier-valor-para-desarrollo
```

### Backend fuera de Docker (hot-reload)
```bash
cd backend
npm install
npm run dev   # nodemon, usa backend/.env (PROD=false → DBHOSTDEV/DBUSERDEV/DBPWDDEV/DBNAMEDEV)
```

### Frontend fuera de Docker
```bash
cd frontend
npm install
ng serve
```
⚠️ `frontend/src/environments/environment.ts` tiene el `apiUrl` **hardcodeado en tiempo de build** (`https://gesdoc.intekgrow.com/api` en producción). Para apuntar a un backend local hay que editar ese archivo temporalmente (no commitear el cambio) o usar `environment.development.ts` si se agrega `fileReplacements` en `angular.json`.

---

## 6. Migraciones de base de datos

### Regla importante
Los scripts en `init/*.sql` se ejecutan **automáticamente y en orden alfabético** solo cuando MySQL inicializa un volumen **completamente vacío** (comportamiento estándar de la imagen oficial `mysql:8` con `docker-entrypoint-initdb.d`). Si el volumen ya tiene datos —como cualquier instalación existente—, **los scripts nuevos no se aplican solos**. Cada migración nueva debe agregarse a `init/` (para instalaciones nuevas) y además **aplicarse manualmente** a cada servidor que ya esté corriendo.

### Convención para migraciones nuevas
- Nombrar `init/0N_descripcion.sql` (siguiente número disponible).
- Deben ser **idempotentes** (seguras de correr más de una vez), usando el patrón ya establecido:
  ```sql
  SET @falta = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tabla' AND COLUMN_NAME = 'columna'
  );
  SET @sql = IF(@falta = 0, 'ALTER TABLE tabla ADD COLUMN columna ...', 'SELECT 1');
  PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
  ```
- Encabezar el archivo con un comentario explicando que debe aplicarse manualmente en instalaciones existentes (mismo formato que los archivos actuales).

### Poner al día un servidor legacy (todas las migraciones pendientes en un solo paso)

Copiar y pegar en el servidor (ajustar `DB_ROOT_PWD` y el nombre de la base si difieren de los defaults):

```bash
docker exec -i gesdoc-mysql mysql -u root -p"$DB_ROOT_PWD" gestiondocumental <<'EOF'
-- 03_users_hardening: cambio de contraseña forzado + último login
SET @has_must_change_password = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'must_change_password'
);
SET @sql = IF(@has_must_change_password = 0, 'ALTER TABLE users ADD COLUMN must_change_password TINYINT(1) DEFAULT 0', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_last_login = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'last_login'
);
SET @sql = IF(@has_last_login = 0, 'ALTER TABLE users ADD COLUMN last_login TIMESTAMP NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 04_folder_description: descripción de carpetas
SET @has_description = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'folders' AND COLUMN_NAME = 'description'
);
SET @sql = IF(@has_description = 0, 'ALTER TABLE folders ADD COLUMN description VARCHAR(255) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 05_file_history_action_varchar: ENUM corrupto -> VARCHAR
SET @is_enum = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'file_history' AND COLUMN_NAME = 'action' AND DATA_TYPE = 'enum'
);
SET @sql = IF(@is_enum = 1, 'ALTER TABLE file_history MODIFY COLUMN action VARCHAR(50) NOT NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
EOF
```

Verificar que quedó todo aplicado:
```bash
docker exec gesdoc-mysql mysql -u root -p"$DB_ROOT_PWD" gestiondocumental -e "DESCRIBE users; DESCRIBE folders; SHOW COLUMNS FROM file_history LIKE 'action';"
```

Todas las sentencias de arriba son seguras de re-ejecutar (no fallan ni duplican columnas si ya están aplicadas), así que ante la duda de si un servidor está al día, se puede correr el bloque completo sin riesgo.

---

## 7. Despliegue

### CI/CD
`push` a `main` dispara `.github/workflows/deploy.yml` en un runner **self-hosted**:
1. Checkout del repo.
2. Escribe el secret `ENV_FILE` (GitHub → Settings → Secrets and variables → Actions) como `.env` en la raíz — falla explícitamente si el secret no existe.
3. `docker compose config -q` — valida que todas las variables requeridas (`SECRET`) estén presentes antes de construir nada.
4. `docker compose build && docker compose up -d --remove-orphans`.
5. `docker image prune -f`.

### Variables requeridas en el secret `ENV_FILE`
```env
DB_ROOT_PWD=...
DBUSER=gesdoc
DBPWD=...
DBNAME=gestiondocumental
DB_PORT=3309
SECRET=...              # obligatorio, sin default — firma los JWT
CORS_ORIGIN=https://gesdoc.intekgrow.com
BACKEND_PORT=8000
FRONTEND_PORT=4200
```

### Topología
- `mysql` (imagen oficial, puerto host `3309`), `backend` (Node, puerto host `8000`), `frontend` (Nginx sirviendo el build de Angular, puerto host `4200`) — todos en la red Docker `gesdoc-net`.
- El proyecto Compose está fijado por nombre (`name: gesdocintekgrowcom` en `docker-compose.yml`), independiente del directorio de checkout, para que el runner siempre reutilice los mismos contenedores/volúmenes/red que la instalación original.
- Un **Apache** externo al stack Docker (fuera de este repo) hace de reverse proxy TLS: `https://gesdoc.intekgrow.com/` → frontend, `/api` → backend.
- Volúmenes persistentes: `mysql_data_ges` (datos de MySQL) y `uploads_data_ges` (archivos subidos en `/app/uploads`).

### Después de cada deploy con migración de esquema
Si el cambio agregó/modificó una migración en `init/`, aplicarla manualmente en el servidor (ver sección 6) — el deploy por sí solo **no** la aplica sobre un volumen ya inicializado.

---

## 8. Puntos a tener en cuenta al seguir desarrollando

- `frontend/src/environments/environment.ts` no es configurable por variable de entorno en runtime — el `apiUrl` queda fijo en el bundle compilado. Si el dominio cambia, hay que actualizar este archivo **y** rebuildear, no solo cambiar `CORS_ORIGIN`.
- El usuario admin semilla (`init/02_seed.sql`) crea `admin` / `Admin123*` sin forzar cambio de contraseña — cambiarla manualmente después del primer despliegue de una instalación nueva.
- El presupuesto de bundle inicial de Angular (`frontend/angular.json`) está en 1.5 MB (`maximumError`) — si el build empieza a fallar por presupuesto de nuevo, es la primera cosa a revisar antes de asumir un bug real.
- Antes de correr pruebas locales contra Docker, usar `docker compose -p gestiondocumental ...` (o el nombre de proyecto que ya esté corriendo localmente) para no crear contenedores/volúmenes duplicados — mismo problema que motivó fijar `name:` en producción.
