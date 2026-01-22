import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { supabase } from './supabase';
import { Session, User, AuthError } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private sessionSignal = signal<Session | null>(null);

  readonly session = this.sessionSignal.asReadonly();
  readonly user = computed(() => this.sessionSignal()?.user ?? null);
  readonly username = computed(() => this.user()?.user_metadata['username'] || 'Usuario');
  readonly isLoggedIn = computed(() => !!this.sessionSignal());

  constructor(private router: Router) {
    this.initSession();

    // Listen for auth changes
    supabase.auth.onAuthStateChange((_event, session) => {
      this.sessionSignal.set(session);
      if (!session) {
        this.router.navigate(['/login']);
      }
    });
  }

  async initSession() {
    const { data: { session } } = await supabase.auth.getSession();
    this.sessionSignal.set(session);
  }

  async signIn(email: string) {
    // For this app, let's use Magic Link or Password.
    // User asked for "usuario y contraseña".
    // So we need to implement signUp as well presumably, or just signIn with password.
  }

  async signUp(email: string, password: string, username: string): Promise<{ error: AuthError | null, data: { user: User | null, session: Session | null } }> {
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username, // Save username in metadata
        }
      }
    });
  }

  async signInWithPassword(email: string, password: string): Promise<{ error: AuthError | null, data: { user: User | null, session: Session | null } }> {
    return await supabase.auth.signInWithPassword({
      email,
      password,
    });
  }

  async signOut() {
    await supabase.auth.signOut();
    this.router.navigate(['/login']);
  }
}
