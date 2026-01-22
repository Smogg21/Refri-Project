import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen hero bg-base-200">
      <div class="flex-col hero-content lg:flex-row-reverse">
        <div class="text-center lg:text-left">
          <h1 class="text-5xl font-bold">Refri Project</h1>
          <p class="py-6">
            Gestiona tu inventario de alimentos de manera inteligente.
            Regístrate o inicia sesión para comenzar.
          </p>
        </div>
        <div class="flex-shrink-0 w-full max-w-sm shadow-2xl card bg-base-100">
          <div class="card-body">
            <h2 class="text-2xl font-bold text-center mb-4">{{ isSignUp() ? 'Registrarse' : 'Iniciar Sesión' }}</h2>

            <div class="form-control" *ngIf="isSignUp()">
              <label class="label">
                <span class="label-text">Nombre (Usuario)</span>
              </label>
              <input type="text" placeholder="Tu nombre" [(ngModel)]="username" class="input input-bordered" required />
            </div>

            <div class="form-control">
              <label class="label">
                <span class="label-text">Email</span>
              </label>
              <input type="email" placeholder="email" [(ngModel)]="email" class="input input-bordered" required />
            </div>

            <div class="form-control">
              <label class="label">
                <span class="label-text">Contraseña</span>
              </label>
              <input type="password" placeholder="password" [(ngModel)]="password" class="input input-bordered" required />
            </div>

            <div *ngIf="errorMessage()" class="alert alert-error mt-4 text-sm shadow-lg">
              <span>{{ errorMessage() }}</span>
            </div>

            <div class="form-control mt-6">
              <button
                class="btn btn-primary"
                [class.loading]="isLoading()"
                (click)="handleSubmit()"
                [disabled]="isLoading()">
                {{ isSignUp() ? 'Registrarse' : 'Entrar' }}
              </button>
            </div>

            <div class="divider">O</div>

            <button class="btn btn-ghost btn-sm" (click)="toggleMode()">
              {{ isSignUp() ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class LoginComponent {
  authService = inject(AuthService);
  router = inject(Router);

  email = '';
  password = '';
  username = '';
  isSignUp = signal(false);
  isLoading = signal(false);
  errorMessage = signal('');

  toggleMode() {
    this.isSignUp.set(!this.isSignUp());
    this.errorMessage.set('');
  }

  async handleSubmit() {
    if (!this.email || !this.password) {
      this.errorMessage.set('Por favor ingresa email y contraseña');
      return;
    }

    if (this.isSignUp() && !this.username) {
        this.errorMessage.set('Por favor ingresa tu nombre');
        return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      let result;
      if (this.isSignUp()) {
        result = await this.authService.signUp(this.email, this.password, this.username);
      } else {
        result = await this.authService.signInWithPassword(this.email, this.password);
      }

      if (result.error) {
        console.error('Supabase Auth Error:', result.error); // Debugging
        const msg = result.error.message.toLowerCase();
        if (msg.includes('already registered') || msg.includes('duplicate')) {
          this.errorMessage.set('Este correo ya está registrado. Por favor inicia sesión.');
        } else {
          this.errorMessage.set(result.error.message);
        }
      } else {
        // If login successful, router validates session and redirects usually,
        // but we can force it here just in case or if logic relies on listener.
        // The listener in AuthService handles redirect on logout, we might want to handle login redirect here explicitly
        // to be faster or wait for session signal.
        if (!this.isSignUp()) {
            this.router.navigate(['/']);
        } else {
            // For sign up, user might need to confirm email if configured in Supabase.
            // Assuming default settings might require confirmation or auto-login.
            // If auto-login happens, session updates.
             this.errorMessage.set('Registro exitoso. Si es necesario, verifica tu email.');
             if (result.data.session) {
                 this.router.navigate(['/']);
             }
        }
      }
    } catch (e: any) {
      this.errorMessage.set('Ocurrió un error inesperado');
      console.error(e);
    } finally {
      this.isLoading.set(false);
    }
  }
}
