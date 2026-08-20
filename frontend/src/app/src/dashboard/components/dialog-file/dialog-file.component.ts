import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FileService } from 'src/app/src/services/file.service';
import { FolderService } from 'src/app/src/services/folder.service';
import { ToastService } from 'src/app/src/services/toast.service';

@Component({
  selector: 'app-dialog-file',
  templateUrl: './dialog-file.component.html',
  styleUrls: ['./dialog-file.component.scss'],
})
export class DialogFileComponent {
  display: FormGroup;
  isUploading = false;
  private fileTmp: any;
  constructor(
    private folderService: FolderService,
    private fileService: FileService,
    private fb: FormBuilder,
    private toast: ToastService,
    public dialogRef: MatDialogRef<DialogFileComponent>,
    @Inject(MAT_DIALOG_DATA) public folder_id: number
  ) {
    this.display = this.fb.group({
      fileControl: ['', Validators.required],
      descControl: [''],
    });
  }
  getFile($event: any) {
    const [file] = $event.target.files;
    this.fileTmp = {
      fileRaw: file,
      fileName: file.name,
    };
    this.display.get('fileControl')?.patchValue(file.name);
  }
  sendFile() {
    const body = new FormData();
    body.append('file', this.fileTmp.fileRaw);
    body.append('name', this.fileTmp.fileName);
    body.append('folder_id', this.folder_id.toString());
    this.isUploading = true;
    this.fileService.createFile(body).subscribe(
      (response) => {
        this.isUploading = false;
        console.log('Respuesta Crear archivo', response.status);
        switch (response.status) {
          case 201:
            this.toast.success('Archivo creado con éxito.');
            this.folderService.getContentFolder(this.folder_id);
            // Realizas el reset del formulario
            this.display.reset();
            // Para restablecer las validaciones después del reset, puedes usar updateValueAndValidity
            this.display.get('fileControl')?.updateValueAndValidity();
            this.dialogRef.close();
            break;
          case 203:
            this.toast.info('Archivo ya existe en el directorio, por favor validar.');
            break;
          default:
            // Realizas el reset del formulario
            this.display.reset();
            // Para restablecer las validaciones después del reset, puedes usar updateValueAndValidity
            this.display.get('fileControl')?.updateValueAndValidity();
            this.dialogRef.close();
            break;
        }
      },
      (error) => {
        this.isUploading = false;
        console.error('Error al subir el archivo:', error);
        this.toast.error(
          error.error?.error ?? 'Error al subir el archivo. Intenta nuevamente.'
        );
      }
    );
  }
  onNoClick(): void {
    this.dialogRef.close();
  }
}
