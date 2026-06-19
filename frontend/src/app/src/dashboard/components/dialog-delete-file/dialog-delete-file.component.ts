import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FileService } from 'src/app/src/services/file.service';
import { FolderService } from 'src/app/src/services/folder.service';
import { ToastService } from 'src/app/src/services/toast.service';

@Component({
  selector: 'app-dialog-delete-file',
  templateUrl: './dialog-delete-file.component.html',
  styleUrls: ['./dialog-delete-file.component.scss'],
})
export class DialogDeleteFileComponent {
  constructor(
    private folderService: FolderService,
    private fileService: FileService,
    private toast: ToastService,
    public dialogRef: MatDialogRef<DialogDeleteFileComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}
  deleteFile(): void {
    this.fileService.deleteFile(this.data.id).subscribe((response) => {
      if (response.error) {
        this.toast.error(response.error);
      } else {
        this.folderService.getContentFolder(this.data.folder_id);
        this.fileService.setNullFile();
        this.dialogRef.close();
      }
    });
  }
  onNoClick(): void {
    this.dialogRef.close();
  }
}
