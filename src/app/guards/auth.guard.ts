import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // We need to wait for the session initialization to complete probably,
  // but since we are using signals and the constructor triggers it,
  // it might be async.
  // For better DX, we might want a loading state or similar,
  // but for now checking isLoggedIn() which is a computed signal.
  // Ideally AuthService should expose an initialized signal or promise.
  // HOWEVER, Supabase auth state change fires properly.

  if (authService.isLoggedIn()) {
    return true;
  }

  // If not logged in redirect to login
  return router.parseUrl('/login');
};
