import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../services/user.service';

export const isLoginGuard = (): boolean => {
  const router = inject(Router);
  const userService = inject(UserService);
  console.log(userService.isAuth());
  if (!userService.isAuth()) {
    router.navigate(['/admin/login']);
    return false;
  } else {
    return true;
  }
};
