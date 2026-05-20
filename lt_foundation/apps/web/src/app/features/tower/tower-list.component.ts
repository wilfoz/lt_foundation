import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TowerApiService } from '../../core/services/tower-api.service';
import { TowerDto } from '@lt/shared-dtos';

@Component({
  selector: 'lt-tower-list',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div>
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-gray-800">Torres Cadastradas</h1>
        <a routerLink="/towers/new" class="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark transition-colors">
          + Nova Torre
        </a>
      </div>

      @if (loading()) {
        <div class="text-center py-12 text-gray-500">Carregando...</div>
      }

      @if (!loading() && towers().length === 0) {
        <div class="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-200">
          <p class="text-gray-500 mb-4">Nenhuma torre cadastrada.</p>
          <a routerLink="/towers/new" class="text-primary hover:underline">Cadastrar primeira torre</a>
        </div>
      }

      @if (towers().length > 0) {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (tower of towers(); track tower.id) {
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div class="flex items-start justify-between">
                <div>
                  <h3 class="font-semibold text-gray-900 text-lg">{{ tower.type }} — Ext. {{ tower.extension }}</h3>
                  <p class="text-gray-500 text-sm mt-1">Hu: {{ tower.Hu }} m</p>
                  <span class="inline-block mt-2 px-2 py-0.5 rounded text-xs font-medium"
                    [class]="tower.classification === 'SELF_SUPPORTING' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'">
                    {{ tower.classification === 'SELF_SUPPORTING' ? 'Autoportante' : 'Estaiada' }}
                  </span>
                </div>
                <a [routerLink]="['/towers', tower.id]" class="text-primary hover:underline text-sm font-medium">
                  Abrir →
                </a>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class TowerListComponent implements OnInit {
  private readonly api = inject(TowerApiService);
  towers = signal<TowerDto[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.api.getTowers().subscribe({
      next: (data) => { this.towers.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
