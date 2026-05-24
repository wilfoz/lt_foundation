import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'lt-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div class="w-full max-w-sm">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-primary">LT Foundation</h1>
          <p class="text-gray-500 mt-2 text-sm">Sistema de Fundações de Torres de LT</p>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 class="text-lg font-semibold text-gray-800 mb-6">Entrar</h2>

          @if (error()) {
            <div class="bg-red-50 border border-red-300 text-red-700 px-3 py-2 rounded-md text-sm mb-4">
              {{ error() }}
            </div>
          }

          <form (ngSubmit)="onSubmit()" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
              <input
                [(ngModel)]="email" name="email" type="email" required
                placeholder="seu@email.com"
                class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Senha</label>
              <input
                [(ngModel)]="password" name="password" type="password" required
                placeholder="••••••••"
                class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <button
              type="submit" [disabled]="loading()"
              class="w-full bg-primary text-white py-2 rounded-md font-medium hover:bg-primary-dark transition-colors disabled:opacity-60 mt-2"
            >
              {{ loading() ? 'Entrando...' : 'Entrar' }}
            </button>
          </form>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  email = '';
  password = '';
  loading = signal(false);
  error = signal<string | null>(null);

  async onSubmit(): Promise<void> {
    if (!this.email || !this.password) {
      this.error.set('Preencha e-mail e senha.');
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.auth.login(this.email, this.password);
      this.router.navigate(['/obras']);
    } catch {
      this.error.set('E-mail ou senha inválidos.');
    } finally {
      this.loading.set(false);
    }
  }
}
