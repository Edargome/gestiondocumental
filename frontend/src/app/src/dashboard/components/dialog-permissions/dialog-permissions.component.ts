import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PermissionsService } from 'src/app/src/services/permissions.service';
import { ToastService } from 'src/app/src/services/toast.service';

@Component({
  selector: 'app-dialog-permissions',
  templateUrl: './dialog-permissions.component.html',
  styleUrls: ['./dialog-permissions.component.scss'],
})
export class DialogPermissionsComponent implements OnInit {
  permissions: any[] = [];
  permissionsForm!: FormGroup;
  displayedColumns: string[] = [
    'username',
    'can_read',
    'can_write',
    'can_delete',
  ];
  loading: boolean = true;
  constructor(
    private fb: FormBuilder,
    private permissionsService: PermissionsService,
    private toast: ToastService,
    public dialogRef: MatDialogRef<DialogPermissionsComponent>,
    @Inject(MAT_DIALOG_DATA) public file_id: number
  ) {
    this.permissionsForm = this.fb.group({
      users: this.fb.array([]), // FormArray para los usuarios
    });
  }

  ngOnInit(): void {
    if (this.file_id) {
      this.loadPermissions(this.file_id);
    }
  }

  loadPermissions(fileId: number): void {
    this.permissionsService.getPermissionsByFile(fileId).subscribe({
      next: (data) => {
        this.initializeForm(data);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar los permisos:', err);
        this.loading = false;
      },
    });
  }

  get users(): FormArray {
    return this.permissionsForm.get('users') as FormArray;
  }

  initializeForm(data: any[]): void {
    data.forEach((user) => {
      const userGroup = this.fb.group({
        user_id: [user.user_id],
        username: [user.username],
        can_read: [user.can_read],
        can_write: [user.can_write],
        can_delete: [user.can_delete],
      });

      // Suscripción para detectar cambios en los checkboxes
      userGroup.valueChanges.subscribe((updatedUser) => {
        this.updateUserOnChange(updatedUser); // Llama al método para enviar los datos
      });

      this.users.push(userGroup);
    });
  }
  updateUserOnChange(updatedUser: any): void {
    console.log(updatedUser);
    this.permissionsService
      .updatePermission(this.file_id, updatedUser)
      .subscribe({
        next: (response) => {
          this.toast.success(`Permiso actualizado: ${updatedUser.username}`);
        },
        error: (error) => {
          this.toast.error(`Error al actualizar permisos de ${updatedUser.username}`);
        },
      });
  }
  onNoClick(): void {
    this.dialogRef.close();
  }
}
