---
name: project-dialog-patterns
description: Patrones establecidos para dialogs de Angular Material en GestionDocumental — estructura, inyección y comunicación con workplace
metadata:
  type: project
---

Los dialogs en este proyecto siguen un patrón consistente:

- Cada dialog tiene su propio directorio en `src/app/src/dashboard/components/dialog-<name>/`
- Se declaran en `DashboardModule` (no son standalone)
- Reciben datos via `@Inject(MAT_DIALOG_DATA)` con una interface exportada nombrada `<Name>DialogData` o `Data<Name>`
- Cierran con `dialogRef.close({ success: true })` / `dialogRef.close({ success: false, error })` o `dialogRef.close()` para cancelar
- El componente padre (`WorkplaceComponent`) maneja el `afterClosed()` y llama `folderService.getContentFolder(parent_folder_id)` + `folderService.getRootTree()` para refrescar vista y árbol

**HttpClient en dialogs**: se inyecta directamente en el dialog cuando la operación es puntual y no justifica un método de servicio dedicado. Para operaciones reutilizables, se agrega al `FolderService` o `FileService`.

**Why:** Patrón observado en `dialog-edit-folder`, `dialog-delete-file`, `dialog-permissions` y el nuevo `dialog-move`.

**How to apply:** Al crear un nuevo dialog, seguir esta estructura y no crear servicios nuevos para operaciones CRUD simples sobre archivos/carpetas.
