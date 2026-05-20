import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'lt-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen bg-gray-50">
      <nav class="bg-primary shadow-md">
        <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <a routerLink="/" class="text-white font-bold text-xl tracking-wide">LT Foundation</a>
          <div class="flex gap-6">
            <a routerLink="/towers" routerLinkActive="underline" class="text-blue-100 hover:text-white transition-colors">Torres</a>
            <a routerLink="/towers/new" class="bg-white text-primary px-3 py-1 rounded font-medium hover:bg-blue-50 transition-colors">+ Nova Torre</a>
          </div>
        </div>
      </nav>
      <main class="max-w-7xl mx-auto px-4 py-8">
        <router-outlet />
      </main>
    </div>
  `,
})
export class AppComponent {}
