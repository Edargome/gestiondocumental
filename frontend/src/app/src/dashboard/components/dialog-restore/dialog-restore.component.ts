import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TrashService } from 'src/app/src/services/trash.service';
import { ToastService } from 'src/app/src/services/toast.service';

@Component({
  selector: 'app-dialog-restore',
  templateUrl: './dialog-restore.component.html',
  styleUrls: ['./dialog-restore.component.scss'],
})
export class DialogRestoreComponent {
  constructor(
    private trashService: TrashService,
    private toast: ToastService,
    public dialogRef: MatDialogRef<DialogRestoreComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { id: number; name: string; type: 'file' | 'folder' }
  ) {}

  restore(): void {
    const request$ =
      this.data.type === 'file'
        ? this.trashService.restoreFile(this.data.id)
        : this.trashService.restoreFolder(this.data.id);

    request$.subscribe({
      next: (response) => {
        if (response.error) {
          this.toast.error(response.error);
        } else {
          this.toast.success(response.message || 'Elemento restaurado con éxito');
          this.dialogRef.close({ restored: true });
        }
      },
      error: () => {
        this.toast.error('Error al restaurar el elemento');
      },
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
