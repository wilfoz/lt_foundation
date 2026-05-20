import { Component, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TowerApiService } from '../../core/services/tower-api.service';

@Component({
  selector: 'lt-tower-form',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="max-w-xl mx-auto">
      <h1 class="text-2xl font-bold text-gray-800 mb-6">Nova Torre</h1>

      @if (error()) {
        <div class="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded mb-4">{{ error() }}</div>
      }

      <form (ngSubmit)="onSubmit()" class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
            <input [(ngModel)]="form.type" name="type" required placeholder="Ex.: SL"
              class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Extensão *</label>
            <input [(ngModel)]="form.extension" name="extension" type="number" required step="0.5"
              class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Hu (m) *</label>
            <input [(ngModel)]="form.Hu" name="Hu" type="number" required step="0.1"
              class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Classificação *</label>
            <select [(ngModel)]="form.classification" name="classification"
              class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="SELF_SUPPORTING">Autoportante</option>
              <option value="GUYED">Estaiada</option>
            </select>
          </div>
        </div>

        <fieldset class="border border-gray-200 rounded-md p-4">
          <legend class="text-sm font-medium text-gray-700 px-2">Ângulo de Deflexão *</legend>
          <div class="grid grid-cols-4 gap-3">
            <div>
              <label class="block text-xs text-gray-500 mb-1">Graus</label>
              <input [(ngModel)]="form.deflectionAngle.deg" name="deg" type="number" min="0" max="359"
                class="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1">Min</label>
              <input [(ngModel)]="form.deflectionAngle.min" name="min" type="number" min="0" max="59"
                class="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1">Seg</label>
              <input [(ngModel)]="form.deflectionAngle.sec" name="sec" type="number" min="0" step="0.1"
                class="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1">Dir</label>
              <select [(ngModel)]="form.deflectionAngle.dir" name="dir"
                class="w-full border border-gray-300 rounded px-2 py-1.5 text-sm">
                <option value="D">D</option>
                <option value="E">E</option>
              </select>
            </div>
          </div>
        </fieldset>

        <div class="flex gap-3 pt-2">
          <button type="submit" [disabled]="saving()"
            class="bg-primary text-white px-5 py-2 rounded-md hover:bg-primary-dark transition-colors disabled:opacity-60">
            {{ saving() ? 'Salvando...' : 'Criar Torre' }}
          </button>
          <button type="button" (click)="cancel()" class="border border-gray-300 px-5 py-2 rounded-md hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  `,
})
export class TowerFormComponent {
  private readonly api = inject(TowerApiService);
  private readonly router = inject(Router);

  saving = signal(false);
  error = signal<string | null>(null);

  form = {
    type: '',
    extension: 6,
    Hu: 21,
    classification: 'SELF_SUPPORTING' as 'SELF_SUPPORTING' | 'GUYED',
    deflectionAngle: { deg: 0, min: 0, sec: 0, dir: 'D' as 'D' | 'E' },
  };

  onSubmit() {
    this.saving.set(true);
    this.error.set(null);
    this.api.createTower(this.form).subscribe({
      next: (tower) => this.router.navigate(['/towers', tower.id]),
      error: (err) => {
        this.error.set(err.error?.message ?? 'Erro ao criar torre.');
        this.saving.set(false);
      },
    });
  }

  cancel() {
    this.router.navigate(['/towers']);
  }
}
