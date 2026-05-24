import { Component, inject, computed } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'lt-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen flex bg-gray-50">

      <!-- Sidebar -->
      <aside class="w-56 bg-white border-r border-gray-200 flex flex-col fixed inset-y-0 left-0 z-10">
        <!-- Logo -->
        <div class="px-5 py-4 border-b border-gray-200">
          <span class="font-bold text-primary text-lg tracking-tight">LT Foundation</span>
          <p class="text-xs text-gray-400 mt-0.5">Fundações de Torres LT</p>
        </div>

        <!-- Nav links -->
        <nav class="flex-1 px-3 py-4 space-y-1">
          <a routerLink="/obras" routerLinkActive="bg-primary-light/10 text-primary font-medium"
            [routerLinkActiveOptions]="{ exact: false }"
            class="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 transition-colors">
            <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2 12L12 2l10 10M5 9v10a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1V9"/>
            </svg>
            Obras
          </a>

          <a routerLink="/catalogo" routerLinkActive="bg-primary-light/10 text-primary font-medium"
            class="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 transition-colors">
            <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            Catálogo
          </a>
        </nav>

        <!-- User / logout -->
        <div class="px-4 py-4 border-t border-gray-200">
          <p class="text-xs text-gray-500 truncate mb-2">{{ userName() }}</p>
          <button (click)="logout()"
            class="w-full text-left text-xs text-gray-500 hover:text-danger transition-colors flex items-center gap-2">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h5a2 2 0 012 2v1"/>
            </svg>
            Sair
          </button>
        </div>
      </aside>

      <!-- Main content -->
      <div class="flex-1 ml-56">
        <main class="px-6 py-6 max-w-7xl">
          <router-outlet />
        </main>
      </div>

    </div>
  `,
})
export class ShellComponent {
  private readonly auth = inject(AuthService);
  readonly userName = computed(() => this.auth.currentUser()?.email ?? '');

  logout(): void {
    this.auth.logout();
  }
}
