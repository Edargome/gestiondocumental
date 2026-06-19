import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FileService } from 'src/app/src/services/file.service';
import { ToastService } from 'src/app/src/services/toast.service';

export interface DataUpdate {
  file_id: number;
  folder_id: number;
}

@Component({
  selector: 'app-dialog-update-file',
  templateUrl: './dialog-update-file.component.html',
  styleUrls: ['./dialog-update-file.component.scss'],
})
export class DialogUpdateFileComponent {
  display: FormGroup;
  private fileTmp: any;
  constructor(
    private fileService: FileService,
    private fb: FormBuilder,
    private toast: ToastService,
    public dialogRef: MatDialogRef<DialogUpdateFileComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DataUpdate
  ) {
    this.display = this.fb.group({
      fileControl: ['', Validators.required],
    });
    console.log(this.data);
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
    body.append('folder_id', this.data.folder_id.toString());
    this.fileService.updateFile(body, this.data.file_id).subscribe(
      (response) => {
        console.log('Respuesta Crear archivo', response.status);
        switch (response.status) {
          case 201:
            this.toast.success('Archivo actualizado con éxito.');
            this.fileService.getFile(this.data.file_id);
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
        console.error(
          'Error al subir el archivo:',
          error.status,
          error.message
        );
      }
    );
  }
  onNoClick(): void {
    this.dialogRef.close();
  }
}
