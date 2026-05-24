import { Component, signal, inject, OnInit } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';

interface WorkTowerItem {
  workTowerId: string;
  towerId: string;
  sequence: number;
  alias?: string;
  status: string;
  tower: { id: string; type: string; extension: number; hu: number; classification: string };
}

@Component({
  selector: 'lt-obra-torres',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-base font-semibold text-gray-800">Torres</h2>
        <a [routerLink]="['/obras', obraId, 'torres', 'nova']"
          class="bg-primary text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-primary-dark transition-colors">
          + Nova Torre
        </a>
      </div>

      @if (loading()) {
        <p class="text-sm text-gray-500">Carregando torres...</p>
      }

      @if (!loading() && towers().length === 0) {
        <div class="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
          <p class="text-gray-500 text-sm">Nenhuma torre nesta obra.</p>
          <a [routerLink]="['/obras', obraId, 'torres', 'nova']"
            class="text-primary text-sm mt-2 inline-block hover:underline">
            Criar primeira torre
          </a>
        </div>
      }

      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        @for (item of towers(); track item.workTowerId) {
          <a [routerLink]="calcRoute(item)"
            class="bg-white rounded-lg border border-gray-200 p-4 hover:border-primary hover:shadow-sm transition-all block">
            <div class="flex items-start justify-between mb-2">
              <div>
                <p class="font-semibold text-gray-900">
                  {{ item.alias ?? ('Torre ' + item.sequence) }}
                  <span class="text-xs text-gray-400 ml-1">#{{ item.sequence }}</span>
                </p>
                <p class="text-xs text-gray-500">{{ item.tower.type }}</p>
              </div>
              <span class="text-xs px-2 py-0.5 rounded-full font-medium"
                [class]="item.tower.classification === 'SELF_SUPPORTING' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'">
                {{ item.tower.classification === 'SELF_SUPPORTING' ? 'Autoportante' : 'Estaiada' }}
              </span>
            </div>
            <p class="text-sm text-gray-500">Ext. {{ item.tower.extension }} m &nbsp;|&nbsp; Hu {{ item.tower.hu }} m</p>
          </a>
        }
      </div>
    </div>
  `,
})
export class ObraTorresComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);

  towers = signal<WorkTowerItem[]>([]);
  loading = signal(true);
  obraId = '';

  ngOnInit(): void {
    this.obraId = this.route.parent!.snapshot.paramMap.get('id') ?? '';
    this.http.get<WorkTowerItem[]>(`/api/v1/obras/${this.obraId}/torres`).subscribe({
      next: (ts) => { this.towers.set(ts); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  calcRoute(item: WorkTowerItem): string[] {
    const type = item.tower.classification === 'SELF_SUPPORTING' ? 'autoportante' : 'estaiada';
    return ['/torres', item.towerId, type];
  }
}
