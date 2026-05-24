import { Component, signal, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TowerApiService } from '../../core/services/tower-api.service';

@Component({
  selector: 'lt-catalogo',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900">Catálogo de Fundações</h1>
        <div class="flex gap-2">
          <select [(ngModel)]="filterKind" (ngModelChange)="load()"
            class="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
            <option value="">Todos os tipos</option>
            <option value="CAISSON">Tubulão</option>
            <option value="FOOTING">Sapata</option>
          </select>
        </div>
      </div>

      @if (loading()) {
        <p class="text-sm text-gray-500">Carregando catálogo...</p>
      }

      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-200 text-left">
              <th class="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Código</th>
              <th class="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipo</th>
              <th class="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Classificação</th>
              <th class="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Descrição</th>
              <th class="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cap. Compressão</th>
              <th class="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cap. Tração</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            @if (!loading() && items().length === 0) {
              <tr>
                <td colspan="6" class="px-5 py-10 text-center text-gray-500">
                  Nenhum item no catálogo.
                </td>
              </tr>
            }
            @for (item of items(); track item.catalogRefId) {
              <tr class="hover:bg-gray-50 transition-colors">
                <td class="px-5 py-3 font-mono text-xs text-gray-800">{{ item.catalogRefId }}</td>
                <td class="px-5 py-3">
                  <span class="text-xs px-2 py-0.5 rounded font-medium"
                    [class]="item.kind === 'CAISSON' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'">
                    {{ item.kind === 'CAISSON' ? 'Tubulão' : 'Sapata' }}
                  </span>
                </td>
                <td class="px-5 py-3 text-xs text-gray-600">{{ item.typeCode }}</td>
                <td class="px-5 py-3 text-gray-700">{{ item.description ?? '—' }}</td>
                <td class="px-5 py-3 text-gray-600 font-mono text-xs">
                  {{ item.loadCapacity?.compression != null ? (item.loadCapacity.compression + ' kN') : '—' }}
                </td>
                <td class="px-5 py-3 text-gray-600 font-mono text-xs">
                  {{ item.loadCapacity?.tension != null ? (item.loadCapacity.tension + ' kN') : '—' }}
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class CatalogoComponent implements OnInit {
  private readonly api = inject(TowerApiService);

  items = signal<any[]>([]);
  loading = signal(true);
  filterKind = '';

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    const kind = this.filterKind as 'CAISSON' | 'FOOTING' | undefined;
    this.api.getCatalog(kind || undefined).subscribe({
      next: (data) => { this.items.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
