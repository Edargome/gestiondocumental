---
name: project-theme-system
description: Light/dark theme implementation details for GestionDocumental Angular 16 app
metadata:
  type: project
---

Se implementó un sistema de light/dark mode completo con las siguientes decisiones:

- `ThemeService` en `src/app/src/services/theme.service.ts` — `providedIn: 'root'`, usa `BehaviorSubject<boolean>`, persiste en `localStorage` con clave `'theme'`, aplica/quita la clase `dark-theme` en `document.body`. En el constructor lee el valor guardado y hace fallback a `prefers-color-scheme`.
- CSS custom properties definidas en `:root` (light) y `.dark-theme` (dark) en `styles.scss`.
- El dark theme de Angular Material se aplica con `@include mat.all-component-colors($frontend-dark-theme)` dentro del selector `.dark-theme`.
- El botón toggle está en `HeaderComponent` — muestra icono `dark_mode` en light y `light_mode` en dark usando `*ngIf` + `async` pipe sobre `isDark$`.
- `MatIconModule` está disponible en `HeaderComponent` porque se exporta desde `dashboard-routing.module.ts`.
- `CommonModule` ya estaba en `DashboardModule`, por lo que `async` pipe y `*ngIf` no requirieron imports adicionales.

**Why:** El sistema usa clase CSS en body en lugar de atributo `data-theme` para compatibilidad directa con el selector SCSS de Angular Material.

**How to apply:** Al agregar nuevos componentes con colores hardcodeados, reemplazar siempre con los tokens `var(--...)` definidos en `:root`. No crear nuevos tokens sin documentarlos aquí.

Tokens disponibles: `--nav-bg`, `--nav-text`, `--sidebar-bg`, `--sidebar-hover`, `--toolbar-bg`, `--content-bg`, `--detail-bg`, `--text-primary`, `--text-secondary`, `--border-color`, `--card-bg`, `--shadow`.
