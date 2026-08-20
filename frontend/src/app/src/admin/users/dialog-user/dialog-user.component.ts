import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UserService } from '../../../services/user.service';
import { ToastService } from '../../../services/toast.service';
import { User } from '../../../interfaces/user';
import { ROLE_OPTIONS, ROLES } from '../../../interfaces/roles';

@Component({
  selector: 'app-dialog-user',
  templateUrl: './dialog-user.component.html',
  styleUrls: ['./dialog-user.component.scss'],
})
export class DialogUserComponent {
  form: FormGroup;
  roleOptions = ROLE_OPTIONS;
  isEdit: boolean;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private toast: ToastService,
    public dialogRef: MatDialogRef<DialogUserComponent>,
    @Inject(MAT_DIALOG_DATA) public user: User | null
  ) {
    this.isEdit = !!user;
    this.form = this.fb.group({
      username: [user?.username ?? '', Validators.required],
      email: [user?.email ?? '', [Validators.required, Validators.email]],
      password: ['', this.isEdit ? [] : [Validators.required, Validators.minLength(8)]],
      accessLevel: [user?.accessLevel ?? ROLES.LECTOR, Validators.required],
    });
  }

  save(): void {
    if (this.form.invalid) {
      return;
    }
    const { username, email, password, accessLevel } = this.form.value;
    if (this.isEdit) {
      this.userService.update(this.user!.user_id, { username, email }).subscribe({
        next: (response) => {
          this.toast.success(response.message ?? 'Usuario actualizado');
          this.dialogRef.close(true);
        },
        error: (err) => {
          this.toast.error(err.error?.error ?? 'No se pudo actualizar el usuario');
        },
      });
    } else {
      this.userService.create({ username, email, password, accessLevel }).subscribe({
        next: (response) => {
          this.toast.success(response.message ?? 'Usuario creado');
          this.dialogRef.close(true);
        },
        error: (err) => {
          this.toast.error(err.error?.error ?? 'No se pudo crear el usuario');
        },
      });
    }
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
