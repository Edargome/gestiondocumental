import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MatTreeModule } from '@angular/material/tree';
import { MatIconModule } from '@angular/material/icon';
import { LayoutComponent } from './layout/layout.component';
import { isLoginGuard } from '../guards/is-login.guard';

const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    canActivate: [isLoginGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule, MatTreeModule, MatIconModule],
})
export class DashboardRoutingModule {}
