import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-force-password',
  templateUrl: './force-password.component.html',
  styleUrls: ['./force-password.component.scss'],
})
export class ForcePasswordComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private toast: ToastService,
    private router: Router
  ) {
    this.form = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  save(): void {
    if (this.form.invalid) {
      return;
    }
    const { currentPassword, newPassword } = this.form.value;
    this.userService.changeOwnPassword(currentPassword, newPassword).subscribe({
      next: (response) => {
        this.toast.success(response.message ?? 'Contraseña actualizada');
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.toast.error(err.error?.error ?? 'No se pudo actualizar la contraseña');
      },
    });
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('level');
    this.router.navigate(['/admin/login']);
  }
}
