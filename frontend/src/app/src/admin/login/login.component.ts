import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  MatSnackBar,
  MatSnackBarHorizontalPosition,
  MatSnackBarVerticalPosition,
} from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  horizontalPosition: MatSnackBarHorizontalPosition = 'center';
  verticalPosition: MatSnackBarVerticalPosition = 'top';
  loginForm: FormGroup = this.fb.group({
    user: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  constructor(
    private fb: FormBuilder,
    private userSevice: UserService,
    private router: Router,
    private _snackBar: MatSnackBar
  ) {}
  onSubmit() {
    const nickname = this.loginForm.value.user;
    const password = this.loginForm.value.password;
    this.userSevice.auth(nickname, password).subscribe((result) => {
      if (result.error == null) {
        const token: string = result.data?.token?.toString()!;
        localStorage.setItem('token', token);
        const payloadBase64 = token.split('.')[1]; // Obtener la parte del payload
        const decodedPayload = atob(
          payloadBase64.replace(/-/g, '+').replace(/_/g, '/')
        ); // Decodificar Base64Url
        localStorage.setItem('level', JSON.parse(decodedPayload).accessLevel);
        this.router.navigate(['/']);
      } else {
        this.openSnackBar(result.error?.toString()!);
      }
    });
  }
  openSnackBar(message: string) {
    this._snackBar.open(message, 'Cerrar', {
      horizontalPosition: this.horizontalPosition,
      verticalPosition: this.verticalPosition,
      duration: 5000,
    });
  }
}
