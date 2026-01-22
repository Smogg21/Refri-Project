import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if we are already logged in in the state
  if (authService.isLoggedIn()) {
    return true;
  }

  // If not, try to fetch the session from Supabase (localStorage)
  const session = await authService.checkSession();
  if (session) {
    return true;
  }

  // If no session found even after checking, redirect to login
  return router.parseUrl('/login');
};
