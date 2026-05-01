import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { User } from '../models/types';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn) return true;
  router.navigate(['/login']);
  return false;
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn) return true;
  router.navigate([auth.roleRedirect()]);
  return false;
};

export function roleGuard(allowedRoles: User['role'][]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.isLoggedIn) {
      router.navigate(['/login']);
      return false;
    }

    try {
      const token = auth.token!;
      const payload: any = JSON.parse(atob(token.split('.')[1]));

      const role =
        payload.roles?.[0] ||
        payload.authorities?.[0] ||
        payload.role;

      const cleanRole = role?.replace('ROLE_', '');

      if (cleanRole && allowedRoles.includes(cleanRole)) {
        return true;
      }

      router.navigate([auth.roleRedirect()]);
      return false;

    } catch (e) {
      console.error('Invalid token', e);
      router.navigate(['/login']);
      return false;
    }
  };
}
