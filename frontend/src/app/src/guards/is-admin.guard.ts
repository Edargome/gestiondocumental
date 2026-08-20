import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { UserService } from '../services/user.service';
import { ROLES } from '../interfaces/roles';

export const isAdminGuard = () => {
  const router = inject(Router);
  const userService = inject(UserService);

  return userService.me().pipe(
    map((user) => {
      if (user.accessLevel === ROLES.ADMIN) {
        return true;
      }
      router.navigate(['/dashboard']);
      return false;
    }),
    catchError(() => {
      router.navigate(['/admin/login']);
      return of(false);
    })
  );
};
