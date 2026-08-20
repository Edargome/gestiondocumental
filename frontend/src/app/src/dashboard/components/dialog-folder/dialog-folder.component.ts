import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FolderService } from 'src/app/src/services/folder.service';
import { ToastService } from 'src/app/src/services/toast.service';

@Component({
  selector: 'app-dialog-folder',
  templateUrl: './dialog-folder.component.html',
  styleUrls: ['./dialog-folder.component.scss'],
})
export class DialogFolderComponent {
  folderDisplay!: FormGroup;
  constructor(
    private folderService: FolderService,
    private folder_fb: FormBuilder,
    private toast: ToastService,
    public dialogRef: MatDialogRef<DialogFolderComponent>,
    @Inject(MAT_DIALOG_DATA) public folder_id: number
  ) {
    this.folderDisplay = this.folder_fb.group({
      folderDescControl: [''],
      folderNameControl: ['', Validators.required],
    });
  }
  seveFolder() {
    const name: string = this.folderDisplay.get('folderNameControl')?.value;
    const desc: string = this.folderDisplay.get('folderDescControl')?.value;
    const parent_folder_id: number = this.folder_id;
    this.folderService.createFolder(parent_folder_id, name, desc).subscribe({
      next: (response) => {
        if (response.folder_id > 0) {
          this.folderService.getRootTree();
          // Realizas el reset del formulario
          this.folderDisplay.reset();
          // Para restablecer las validaciones después del reset, puedes usar updateValueAndValidity
          this.folderDisplay.get('fileControl')?.updateValueAndValidity();
          this.folderService.getContentFolder(parent_folder_id);
          this.dialogRef.close();
        } else {
          this.toast.error(response.error);
        }
      },
      error: (error) => {
        this.toast.error(error.error?.error ?? 'Error al crear la carpeta.');
      },
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
