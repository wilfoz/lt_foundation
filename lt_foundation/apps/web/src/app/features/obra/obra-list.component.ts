import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ObraApiService, WorkStatus } from '../../core/services/obra-api.service';

@Component({
  selector: 'lt-obra-list',
  standalone: true,
  imports: [RouterLink, DatePipe],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900">Obras</h1>
        <a routerLink="/obras/nova"
          class="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-dark transition-colors">
          + Nova Obra
        </a>
      </div>

      @if (obras().length === 0) {
        <div class="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
          <p class="text-gray-500 text-sm">Nenhuma obra cadastrada.</p>
          <a routerLink="/obras/nova" class="text-primary text-sm mt-2 inline-block hover:underline">
            Criar primeira obra
          </a>
        </div>
      }

      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        @for (obra of obras(); track obra.id) {
          <a [routerLink]="['/obras', obra.id, 'torres']"
            class="bg-white rounded-xl border border-gray-200 p-5 hover:border-primary hover:shadow-sm transition-all block">
            <div class="flex items-start justify-between mb-3">
              <div>
                <p class="font-semibold text-gray-900">{{ obra.name }}</p>
                <p class="text-xs text-gray-500 mt-0.5">{{ obra.contractNumber }}</p>
              </div>
              <span class="text-xs px-2 py-0.5 rounded-full font-medium"
                [class]="statusClass(obra.status)">
                {{ statusLabel(obra.status) }}
              </span>
            </div>
            @if (obra.description) {
              <p class="text-sm text-gray-600">{{ obra.description }}</p>
            }
            <p class="text-xs text-gray-400 mt-2">
              Criada em {{ obra.createdAt | date:'dd/MM/yyyy' }}
            </p>
          </a>
        }
      </div>
    </div>
  `,
})
export class ObraListComponent implements OnInit {
  private readonly obraService = inject(ObraApiService);
  readonly obras = this.obraService.all;

  ngOnInit(): void {
    this.obraService.loadAll();
  }

  statusClass(status: WorkStatus): string {
    const map: Record<WorkStatus, string> = {
      DRAFT: 'bg-gray-100 text-gray-600',
      IN_PROGRESS: 'bg-blue-100 text-blue-700',
      COMPLETED: 'bg-green-100 text-green-700',
      ARCHIVED: 'bg-yellow-100 text-yellow-700',
    };
    return map[status] ?? 'bg-gray-100 text-gray-500';
  }

  statusLabel(status: WorkStatus): string {
    const map: Record<WorkStatus, string> = {
      DRAFT: 'Rascunho',
      IN_PROGRESS: 'Em andamento',
      COMPLETED: 'Concluída',
      ARCHIVED: 'Arquivada',
    };
    return map[status] ?? status;
  }
}
