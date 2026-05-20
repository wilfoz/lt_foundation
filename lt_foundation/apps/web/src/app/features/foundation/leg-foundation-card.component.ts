import { Component, Input, Output, EventEmitter, signal, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TowerApiService } from '../../core/services/tower-api.service';
import { LegDto, ElementCalculationResultDto, ValidationResultDto } from '@lt/shared-dtos';
import { ValidationBadgeComponent } from '../../shared/components/validation-badge.component';

@Component({
  selector: 'lt-leg-foundation-card',
  standalone: true,
  imports: [FormsModule, ValidationBadgeComponent],
  template: `
    <div class="bg-white rounded-lg border-2 p-4 space-y-3 transition-all" [class]="cardBorderClass()">
      <!-- Card header -->
      <div class="flex items-center justify-between">
        <span class="font-bold text-gray-800 text-lg">Perna {{ leg.id }}</span>
        <span class="text-xs px-2 py-0.5 rounded font-medium" [class]="badgeClass()">
          {{ badgeLabel() }}
        </span>
      </div>

      <!-- Foundation selector -->
      <div>
        <label class="block text-xs text-gray-500 mb-1">Tipo de Fundação</label>
        <select [(ngModel)]="selectedKind" (ngModelChange)="onKindChange()"
          class="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
          <option value="">— Selecionar —</option>
          <option value="CAISSON">Tubulão</option>
          <option value="FOOTING">Sapata</option>
        </select>
      </div>

      @if (selectedKind) {
        <div>
          <label class="block text-xs text-gray-500 mb-1">Banco de Fundações</label>
          <select [(ngModel)]="selectedCatalogRef" (ngModelChange)="saveFoundation()"
            class="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
            <option value="">— Selecionar —</option>
            @for (item of catalog(); track item.catalogRefId) {
              <option [value]="item.catalogRefId">{{ item.description ?? item.catalogRefId }}</option>
            }
          </select>
        </div>
      }

      <!-- Survey inputs -->
      <fieldset class="border border-gray-100 rounded p-3 space-y-2">
        <legend class="text-xs text-gray-400 px-1">Topografia</legend>
        <div class="grid grid-cols-3 gap-2">
          <div>
            <label class="block text-xs text-gray-500 mb-0.5">Nc (m)</label>
            <input [(ngModel)]="survey.naturalElevation" type="number" step="0.001" (blur)="saveSurvey()"
              class="w-full border border-gray-300 rounded px-2 py-1 text-xs" />
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-0.5">Ncc (m)</label>
            <input [(ngModel)]="survey.concreteCastingElevation" type="number" step="0.001" (blur)="saveSurvey()"
              class="w-full border border-gray-300 rounded px-2 py-1 text-xs" />
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-0.5">Dist (m)</label>
            <input [(ngModel)]="survey.distance" type="number" step="0.001" (blur)="saveSurvey()"
              class="w-full border border-gray-300 rounded px-2 py-1 text-xs" />
          </div>
        </div>
      </fieldset>

      <!-- Calculation results -->
      @if (calculationResult) {
        <div class="bg-gray-50 rounded p-3 text-xs space-y-1 font-mono">
          <div class="grid grid-cols-2 gap-x-4">
            <span class="text-gray-500">Afl:</span><span class="font-medium">{{ calculationResult.Afl.toFixed(4) }} m</span>
            <span class="text-gray-500">G:</span><span class="font-medium">{{ calculationResult.G.toFixed(4) }} m</span>
            <span class="text-gray-500">H:</span><span class="font-medium">{{ calculationResult.H.toFixed(4) }} m</span>
            <span class="text-gray-500">NFC:</span><span class="font-medium">{{ calculationResult.NFC.toFixed(4) }} m</span>
          </div>
          @if ('totalVolume' in calculationResult.volumes) {
            <div class="pt-1 border-t border-gray-200 grid grid-cols-2 gap-x-4">
              <span class="text-gray-500">V Total:</span><span class="font-medium">{{ calculationResult.volumes.totalVolume.toFixed(4) }} m³</span>
              <span class="text-gray-500">V Escav.:</span><span class="font-medium">{{ calculationResult.volumes.excavationVolume.toFixed(4) }} m³</span>
            </div>
          }
        </div>
      }

      <!-- Validations -->
      @for (v of validations; track v.id) {
        <lt-validation-badge [validation]="v" />
      }
    </div>
  `,
})
export class LegFoundationCardComponent implements OnInit {
  @Input({ required: true }) towerId!: string;
  @Input({ required: true }) leg!: LegDto;
  @Input() calculationResult: ElementCalculationResultDto | null = null;
  @Input() validations: ValidationResultDto[] = [];
  @Output() updated = new EventEmitter<void>();

  private readonly api = inject(TowerApiService);

  catalog = signal<any[]>([]);
  selectedKind = '';
  selectedCatalogRef = '';
  survey = { naturalElevation: 0, concreteCastingElevation: 0, distance: 0 };

  ngOnInit() {
    if (this.leg.foundation) {
      this.selectedKind = this.leg.foundation.kind;
      this.selectedCatalogRef = this.leg.foundation.catalogRefId;
      this.loadCatalog();
    }
    if (this.leg.survey) {
      this.survey = { ...this.leg.survey };
    }
  }

  cardBorderClass() {
    if (this.validations.some((v) => v.severity === 'BLOCKING')) return 'border-danger';
    if (this.validations.some((v) => v.severity === 'ALERT')) return 'border-warning';
    if (this.calculationResult) return 'border-success';
    return 'border-gray-200';
  }

  badgeClass() {
    if (this.validations.some((v) => v.severity === 'BLOCKING')) return 'bg-red-100 text-red-700';
    if (this.validations.some((v) => v.severity === 'ALERT')) return 'bg-yellow-100 text-yellow-700';
    if (this.calculationResult) return 'bg-green-100 text-green-700';
    return 'bg-gray-100 text-gray-500';
  }

  badgeLabel() {
    if (this.validations.some((v) => v.severity === 'BLOCKING')) return 'Bloqueado';
    if (this.validations.some((v) => v.severity === 'ALERT')) return 'Alerta';
    if (this.calculationResult) return 'OK';
    return 'Pendente';
  }

  onKindChange() {
    this.selectedCatalogRef = '';
    this.loadCatalog();
  }

  loadCatalog() {
    if (!this.selectedKind) return;
    this.api.getCatalog(this.selectedKind as 'CAISSON' | 'FOOTING').subscribe((items) => this.catalog.set(items));
  }

  saveFoundation() {
    if (!this.selectedKind || !this.selectedCatalogRef) return;
    this.api.selectFoundationForLeg(this.towerId, this.leg.id, {
      kind: this.selectedKind,
      catalogRefId: this.selectedCatalogRef,
    }).subscribe(() => this.updated.emit());
  }

  saveSurvey() {
    this.api.updateLeg(this.towerId, this.leg.id, { survey: this.survey })
      .subscribe(() => this.updated.emit());
  }
}
