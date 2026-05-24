import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, ActivatedRoute } from '@angular/router';
import { ObraApiService, Obra, WorkStatus } from '../../core/services/obra-api.service';

@Component({
  selector: 'lt-obra-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    @if (obra()) {
      <div class="space-y-0">
        <div class="mb-5">
          <div class="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <a routerLink="/obras" class="hover:text-primary transition-colors">Obras</a>
            <span>/</span>
            <span class="text-gray-800 font-medium">{{ obra()!.name }}</span>
            <span class="text-xs px-2 py-0.5 rounded-full ml-1 font-medium" [class]="statusClass(obra()!.status)">
              {{ statusLabel(obra()!.status) }}
            </span>
          </div>
          <h1 class="text-xl font-bold text-gray-900">{{ obra()!.name }}</h1>
          <p class="text-sm text-gray-500">
            {{ obra()!.contractNumber }}
            @if (obra()!.description) { · {{ obra()!.description }} }
          </p>
        </div>

        <nav class="flex gap-1 border-b border-gray-200 mb-6">
          <a [routerLink]="['torres']" routerLinkActive="border-b-2 border-primary text-primary font-medium"
            class="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors -mb-px">
            Torres
          </a>
          <a [routerLink]="['documentos']" routerLinkActive="border-b-2 border-primary text-primary font-medium"
            class="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors -mb-px">
            Documentos
          </a>
          <a [routerLink]="['validacao']" routerLinkActive="border-b-2 border-primary text-primary font-medium"
            class="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors -mb-px">
            Validação
          </a>
        </nav>

        <router-outlet />
      </div>
    } @else if (notFound()) {
      <p class="text-gray-500 text-sm">Obra não encontrada.</p>
    } @else {
      <p class="text-gray-400 text-sm">Carregando...</p>
    }
  `,
})
export class ObraShellComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly obraService = inject(ObraApiService);

  readonly obra = signal<Obra | undefined>(undefined);
  readonly notFound = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.obraService.getById(id).then((o) => this.obra.set(o)).catch(() => this.notFound.set(true));
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
