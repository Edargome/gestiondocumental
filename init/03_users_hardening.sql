-- Fase 4: endurecimiento de administración de usuarios.
-- Los scripts de /init solo corren en la creación inicial del volumen de MySQL.
-- Si ya tienes un volumen existente, aplica este archivo manualmente:
--   docker compose exec -T mysql mysql -u root -p"$DB_ROOT_PWD" "$DBNAME" < init/03_users_hardening.sql

SET @has_must_change_password = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'must_change_password'
);
SET @sql = IF(
  @has_must_change_password = 0,
  'ALTER TABLE users ADD COLUMN must_change_password TINYINT(1) DEFAULT 0',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_last_login = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'last_login'
);
SET @sql = IF(
  @has_last_login = 0,
  'ALTER TABLE users ADD COLUMN last_login TIMESTAMP NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
