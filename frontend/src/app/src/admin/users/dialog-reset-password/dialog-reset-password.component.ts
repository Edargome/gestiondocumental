import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UserService } from '../../../services/user.service';
import { ToastService } from '../../../services/toast.service';
import { User } from '../../../interfaces/user';

@Component({
  selector: 'app-dialog-reset-password',
  templateUrl: './dialog-reset-password.component.html',
  styleUrls: ['./dialog-reset-password.component.scss'],
})
export class DialogResetPasswordComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private toast: ToastService,
    public dialogRef: MatDialogRef<DialogResetPasswordComponent>,
    @Inject(MAT_DIALOG_DATA) public user: User
  ) {
    this.form = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  save(): void {
    if (this.form.invalid) {
      return;
    }
    this.userService.resetPassword(this.user.user_id, this.form.value.password).subscribe({
      next: (response) => {
        this.toast.success(response.message ?? 'Contraseña restablecida');
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.toast.error(err.error?.error ?? 'No se pudo restablecer la contraseña');
      },
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
