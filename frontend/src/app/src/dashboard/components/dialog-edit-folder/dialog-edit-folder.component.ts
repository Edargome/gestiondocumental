import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CurrentFolderService } from 'src/app/src/services/current-folder.service';
import { FolderService } from 'src/app/src/services/folder.service';
import { ToastService } from 'src/app/src/services/toast.service';

@Component({
  selector: 'app-dialog-edit-folder',
  templateUrl: './dialog-edit-folder.component.html',
  styleUrls: ['./dialog-edit-folder.component.scss'],
})
export class DialogEditFolderComponent {
  folderDisplay!: FormGroup;
  constructor(
    private currentFolderService: CurrentFolderService,
    private folderService: FolderService,
    private folder_fb: FormBuilder,
    private toast: ToastService,
    public dialogRef: MatDialogRef<DialogEditFolderComponent>,
    @Inject(MAT_DIALOG_DATA) public folder: any
  ) {
    this.folderDisplay = this.folder_fb.group({
      folderDescControl: [this.folder.description || ''],
      folderNameControl: [this.folder.name, Validators.required],
    });
  }
  seveFolder() {
    const name: string = this.folderDisplay.get('folderNameControl')?.value;
    const desc: string = this.folderDisplay.get('folderDescControl')?.value;
    const folder_id: number = this.folder.id;
    this.folderService.updateFolder(folder_id, name, desc).subscribe({
      next: (response) => {
        if (response.message) {
          this.toast.success(response.message);
          this.folderService.getRootTree();
          // Realizas el reset del formulario
          this.folderDisplay.reset();
          // Para restablecer las validaciones después del reset, puedes usar updateValueAndValidity
          this.currentFolderService.currentFolder$.subscribe((folder_id) => {
            this.folderService.getContentFolder(folder_id);
            this.folderService.getFolderPath(folder_id);
            this.folderDisplay.get('fileControl')?.updateValueAndValidity();
          });
          this.dialogRef.close();
        } else {
          this.toast.error(response.error);
        }
      },
      error: (error) => {
        this.toast.error(error.error?.error ?? 'Error al actualizar la carpeta.');
      },
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
