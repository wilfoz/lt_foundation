import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ObraApiService } from '../../core/services/obra-api.service';

@Component({
  selector: 'lt-obra-form',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="max-w-lg">
      <div class="flex items-center gap-3 mb-6">
        <a routerLink="/obras" class="text-gray-400 hover:text-gray-600 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
        </a>
        <h1 class="text-2xl font-bold text-gray-900">Nova Obra</h1>
      </div>

      @if (error()) {
        <div class="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-md text-sm mb-4">
          {{ error() }}
        </div>
      }

      <form (ngSubmit)="onSubmit()" class="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Nome da Obra *</label>
          <input [(ngModel)]="form.name" name="name" required
            placeholder="Ex.: LT 500 kV Xingu – Estreito"
            class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Número do Contrato *</label>
          <input [(ngModel)]="form.contractNumber" name="contractNumber" required
            placeholder="Ex.: LT-500-XIN-001"
            class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Descrição / Localização</label>
          <input [(ngModel)]="form.description" name="description"
            placeholder="Ex.: Pará / Maranhão"
            class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>

        <div class="flex gap-3 pt-2">
          <button type="submit" [disabled]="saving()"
            class="bg-primary text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-60">
            {{ saving() ? 'Criando...' : 'Criar Obra' }}
          </button>
          <a routerLink="/obras"
            class="border border-gray-300 px-5 py-2 rounded-md text-sm hover:bg-gray-50 transition-colors">
            Cancelar
          </a>
        </div>
      </form>
    </div>
  `,
})
export class ObraFormComponent {
  private readonly obraService = inject(ObraApiService);
  private readonly router = inject(Router);

  saving = signal(false);
  error = signal<string | null>(null);

  form = { name: '', contractNumber: '', description: '' };

  onSubmit(): void {
    if (!this.form.name || !this.form.contractNumber) {
      this.error.set('Nome e número do contrato são obrigatórios.');
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    this.obraService
      .create(this.form)
      .then((obra) => this.router.navigate(['/obras', obra.id, 'torres']))
      .catch(() => this.error.set('Erro ao criar obra. Tente novamente.'))
      .finally(() => this.saving.set(false));
  }
}
