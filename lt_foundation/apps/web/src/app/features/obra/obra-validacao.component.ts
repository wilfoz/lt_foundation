import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common';

interface ReviewField {
  id: string;
  key: string;
  extractedValue: string;
  parsedValue: unknown;
  humanValue: unknown;
  confidence: number;
  needsReview: boolean;
  inspected: boolean;
  overridden: boolean;
}

interface ReviewItem {
  id: string;
  entityType: string;
  status: string;
  createdAt: string;
  fields: ReviewField[];
}

@Component({
  selector: 'lt-obra-validacao',
  standalone: true,
  imports: [DatePipe],
  template: `
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-base font-semibold text-gray-800">Fila de Validação</h2>
        <span class="text-xs font-medium px-2.5 py-1 rounded-full"
          [class]="items().length > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'">
          {{ items().length }} pendente{{ items().length !== 1 ? 's' : '' }}
        </span>
      </div>

      @if (loading()) {
        <p class="text-sm text-gray-500">Carregando fila...</p>
      } @else if (items().length === 0) {
        <div class="bg-white rounded-xl border border-gray-200 px-5 py-12 text-center text-gray-500 text-sm">
          Nenhuma validação pendente.
          <p class="text-xs text-gray-400 mt-1">
            Os itens a revisar aparecem aqui após o processamento de documentos.
          </p>
        </div>
      } @else {
        <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div class="px-5 py-3 bg-gray-50 border-b border-gray-200 grid grid-cols-5 gap-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <span>Entidade</span>
            <span>Status</span>
            <span>Campos</span>
            <span>Precisam revisão</span>
            <span>Entrada</span>
          </div>

          @for (item of items(); track item.id) {
            <div class="px-5 py-4 border-b border-gray-100 last:border-0 grid grid-cols-5 gap-4 items-center hover:bg-gray-50 transition-colors">
              <span class="text-xs font-medium text-gray-700">{{ entityLabel(item.entityType) }}</span>

              <span class="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium w-fit"
                [class]="statusClass(item.status)">
                {{ statusLabel(item.status) }}
              </span>

              <span class="text-xs text-gray-500">{{ item.fields.length }} campos</span>

              <span class="text-xs font-medium" [class]="needsReviewCount(item) > 0 ? 'text-red-600' : 'text-green-600'">
                {{ needsReviewCount(item) }} não inspecionado{{ needsReviewCount(item) !== 1 ? 's' : '' }}
              </span>

              <span class="text-xs text-gray-400">{{ item.createdAt | date:'dd/MM/yy HH:mm' }}</span>
            </div>
          }
        </div>

        <p class="text-xs text-gray-400 mt-2">
          Use a API <code class="bg-gray-100 px-1 rounded">POST /review-items/:id/approve</code> ou
          <code class="bg-gray-100 px-1 rounded">POST /review-items/:id/reject</code> para processar itens.
          Interface detalhada disponível em breve.
        </p>
      }
    </div>
  `,
})
export class ObraValidacaoComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);

  items = signal<ReviewItem[]>([]);
  loading = signal(true);
  private workId = '';

  ngOnInit(): void {
    this.workId = this.route.parent!.snapshot.paramMap.get('id') ?? '';
    this.http.get<ReviewItem[]>(`/api/v1/obras/${this.workId}/validacao`).subscribe({
      next: (data) => { this.items.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  needsReviewCount(item: ReviewItem): number {
    return item.fields.filter((f) => f.needsReview && !f.inspected).length;
  }

  entityLabel(type: string): string {
    const map: Record<string, string> = {
      TOWER: 'Torre', LEG: 'Perna', STAY: 'Estai',
      FOUNDATION: 'Fundação', LOCATION: 'Locação',
    };
    return map[type] ?? type;
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-700',
      IN_REVIEW: 'bg-blue-100 text-blue-700',
      APPROVED: 'bg-green-100 text-green-700',
      REJECTED: 'bg-red-100 text-red-700',
    };
    return map[status] ?? 'bg-gray-100 text-gray-500';
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'Pendente', IN_REVIEW: 'Em revisão',
      APPROVED: 'Aprovado', REJECTED: 'Rejeitado',
    };
    return map[status] ?? status;
  }
}
