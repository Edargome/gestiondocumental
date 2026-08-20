import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { UsersComponent } from './users/users.component';
import { ForcePasswordComponent } from './force-password/force-password.component';
import { isLoginGuard } from '../guards/is-login.guard';
import { isAdminGuard } from '../guards/is-admin.guard';

const routes: Routes = [
  {
    path: '',
    children: [
      { path: 'login', component: LoginComponent },
      {
        path: 'cambiar-password',
        component: ForcePasswordComponent,
        canActivate: [isLoginGuard],
      },
      {
        path: 'usuarios',
        component: UsersComponent,
        canActivate: [isLoginGuard, isAdminGuard],
      },
      { path: '**', redirectTo: 'login' },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutingModule {}
