import { Component, Input, Output, EventEmitter, signal, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TowerApiService } from '../../core/services/tower-api.service';
import { GuyedElementDto, ElementCalculationResultDto, ValidationResultDto } from '@lt/shared-dtos';
import { ValidationBadgeComponent } from '../../shared/components/validation-badge.component';

@Component({
  selector: 'lt-guyed-element-card',
  standalone: true,
  imports: [FormsModule, ValidationBadgeComponent],
  template: `
    <div class="bg-white rounded-lg border-2 p-4 space-y-3 transition-all" [class]="cardBorderClass()">
      <div class="flex items-center justify-between">
        <span class="font-bold text-gray-800 text-lg">{{ element.id === 'MC' ? 'Mastro Central' : 'Estai ' + element.id }}</span>
        <span class="text-xs px-2 py-0.5 rounded font-medium" [class]="badgeClass()">{{ badgeLabel() }}</span>
      </div>

      <!-- Foundation selection -->
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
            class="w-full border border-gray-300 rounded px-2 py-1.5 text-sm">
            <option value="">— Selecionar —</option>
            @for (item of catalog(); track item.catalogRefId) {
              <option [value]="item.catalogRefId">{{ item.description ?? item.catalogRefId }}</option>
            }
          </select>
        </div>
      }

      <!-- Survey -->
      <fieldset class="border border-gray-100 rounded p-3 space-y-2">
        <legend class="text-xs text-gray-400 px-1">Topografia</legend>
        <div class="grid grid-cols-3 gap-2">
          <div>
            <label class="block text-xs text-gray-500 mb-0.5">Nc (m)</label>
            <input [(ngModel)]="survey.naturalElevation" type="number" step="0.001" (blur)="saveData()"
              class="w-full border border-gray-300 rounded px-2 py-1 text-xs" />
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-0.5">Ncc (m)</label>
            <input [(ngModel)]="survey.concreteCastingElevation" type="number" step="0.001" (blur)="saveData()"
              class="w-full border border-gray-300 rounded px-2 py-1 text-xs" />
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-0.5">Dist. Proj. (m)</label>
            <input [(ngModel)]="survey.distance" type="number" step="0.001" (blur)="saveData()"
              class="w-full border border-gray-300 rounded px-2 py-1 text-xs" />
          </div>
        </div>
      </fieldset>

      <!-- Stay geometry (stays only) -->
      @if (element.id !== 'MC') {
        <fieldset class="border border-gray-100 rounded p-3 space-y-2">
          <legend class="text-xs text-gray-400 px-1">Geometria do Estai</legend>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-xs text-gray-500 mb-0.5">Ângulo Horiz. (°)</label>
              <input [(ngModel)]="stayHorizAngle" type="number" step="0.1" (blur)="saveData()"
                class="w-full border border-gray-300 rounded px-2 py-1 text-xs" />
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-0.5">Inclinação (°)</label>
              <input [(ngModel)]="stayInclination" type="number" step="0.1" (blur)="saveData()"
                class="w-full border border-gray-300 rounded px-2 py-1 text-xs" />
            </div>
          </div>
          @if (calculationResult?.stayRadialDistance != null) {
            <p class="text-xs text-blue-700 font-mono">R (teórico) = {{ calculationResult!.stayRadialDistance!.toFixed(3) }} m</p>
          }
        </fieldset>

        <!-- Terrain correction (Fundacao SM-VPM pipeline) -->
        <fieldset class="border border-blue-100 rounded p-3 space-y-2">
          <legend class="text-xs text-blue-500 px-1">Correção por Terreno</legend>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-xs text-gray-500 mb-0.5">Cota PF (m)</label>
              <input [(ngModel)]="terrain.cotaPF" type="number" step="0.001" (blur)="saveData()"
                class="w-full border border-gray-300 rounded px-2 py-1 text-xs" />
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-0.5" title="Cota a 5 m do PF">P5 (m)</label>
              <input [(ngModel)]="terrain.P5" type="number" step="0.001" (blur)="saveData()"
                class="w-full border border-gray-300 rounded px-2 py-1 text-xs" />
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-0.5" title="Distância horizontal MC → CC">XCC (m)</label>
              <input [(ngModel)]="terrain.XCC" type="number" step="0.001" (blur)="saveData()"
                class="w-full border border-gray-300 rounded px-2 py-1 text-xs" />
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-0.5" title="Elevação do ponto de fixação no mastro">Elev. Fix. (m)</label>
              <input [(ngModel)]="terrain.elevFixation" type="number" step="0.001" (blur)="saveData()"
                class="w-full border border-gray-300 rounded px-2 py-1 text-xs" />
            </div>
            <div class="col-span-2">
              <label class="block text-xs text-gray-500 mb-0.5" title="N5SEL=0.7647 / N5SEM=0.7383">Tg Estai</label>
              <input [(ngModel)]="terrain.stayTangent" type="number" step="0.0001" (blur)="saveData()"
                class="w-full border border-gray-300 rounded px-2 py-1 text-xs" />
            </div>
          </div>

          <!-- Terrain correction results -->
          @if (anchorPoint()?.terrainAdjusted) {
            <div class="mt-2 bg-blue-50 rounded p-2 text-xs font-mono space-y-1">
              <p class="text-blue-600 font-semibold text-xs mb-1">Valores Ajustados</p>
              <div class="grid grid-cols-2 gap-x-3">
                <span class="text-gray-500">alfa:</span>
                <span>{{ (anchorPoint()!.alfa! * 180 / Math.PI).toFixed(4) }}°</span>
                <span class="text-gray-500">NCC aj.:</span>
                <span>{{ anchorPoint()!.adjustedNCC?.toFixed(4) }} m</span>
                <span class="text-gray-500">HC aj.:</span>
                <span>{{ anchorPoint()!.adjustedHC?.toFixed(4) }} m</span>
                <span class="text-gray-500">Dist. Real:</span>
                <span>{{ anchorPoint()!.realDistance?.toFixed(4) }} m</span>
                <span class="text-gray-500">Comp. Cabo:</span>
                <span class="font-bold">{{ anchorPoint()!.cableCutLength?.toFixed(4) }} m</span>
              </div>
            </div>
          }
          @if (anchorPoint() && !anchorPoint()!.terrainAdjusted) {
            <p class="text-xs text-yellow-600 mt-1">Preencha P5, XCC, Elev. Fix. e Tg Estai para calcular correção.</p>
          }
        </fieldset>
      }

      <!-- Calculation results -->
      @if (calculationResult) {
        <div class="bg-gray-50 rounded p-3 text-xs space-y-1 font-mono">
          <div class="grid grid-cols-2 gap-x-4">
            <span class="text-gray-500">Afl:</span><span>{{ calculationResult.Afl.toFixed(4) }} m</span>
            <span class="text-gray-500">G:</span><span>{{ calculationResult.G.toFixed(4) }} m</span>
            <span class="text-gray-500">H:</span><span>{{ calculationResult.H.toFixed(4) }} m</span>
            <span class="text-gray-500">NFC:</span><span>{{ calculationResult.NFC.toFixed(4) }} m</span>
          </div>
        </div>
      }

      @for (v of validations; track v.id) {
        <lt-validation-badge [validation]="v" />
      }
    </div>
  `,
})
export class GuyedElementCardComponent implements OnInit {
  @Input({ required: true }) towerId!: string;
  @Input({ required: true }) element!: GuyedElementDto;
  @Input() calculationResult: ElementCalculationResultDto | null = null;
  @Input() validations: ValidationResultDto[] = [];
  @Output() updated = new EventEmitter<void>();

  protected readonly Math = Math;

  private readonly api = inject(TowerApiService);
  catalog = signal<any[]>([]);
  selectedKind = '';
  selectedCatalogRef = '';
  survey = { naturalElevation: 0, concreteCastingElevation: 0, distance: 0 };
  stayHorizAngle = 0;
  stayInclination = 45;
  terrain = { cotaPF: 0, P5: 0, XCC: 0, elevFixation: 100.2, stayTangent: 0 };

  anchorPoint = signal<GuyedElementDto['anchorPoint']>(undefined);

  ngOnInit() {
    if (this.element.foundation) {
      this.selectedKind = this.element.foundation.kind;
      this.selectedCatalogRef = this.element.foundation.catalogRefId;
      this.loadCatalog();
    }
    if (this.element.survey) this.survey = { ...this.element.survey };
    if (this.element.stay) {
      this.stayHorizAngle = this.element.stay.horizontalAngle?.deg ?? 0;
      this.stayInclination = this.element.stay.inclinationAngle ?? 45;
    }
    if (this.element.anchorPoint) {
      const ap = this.element.anchorPoint;
      this.terrain = {
        cotaPF: ap.cotaPF,
        P5: ap.P5 ?? 0,
        XCC: ap.XCC ?? 0,
        elevFixation: 100.2,
        stayTangent: 0,
      };
      this.anchorPoint.set(ap);
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
    this.api.selectFoundationForElement(this.towerId, this.element.id, {
      kind: this.selectedKind,
      catalogRefId: this.selectedCatalogRef,
    }).subscribe(() => this.updated.emit());
  }

  saveData() {
    const body: any = { survey: this.survey };
    if (this.element.id !== 'MC') {
      body.stayHorizontalAngleDeg = this.stayHorizAngle;
      body.stayInclinationAngleDeg = this.stayInclination;
      if (this.terrain.cotaPF > 0) {
        body.cotaPF = this.terrain.cotaPF;
        body.referencePoint5m = this.terrain.P5;
        body.distanceToCC = this.terrain.XCC;
        body.elevFixation = this.terrain.elevFixation;
        body.stayTangent = this.terrain.stayTangent;
      }
    }
    this.api.updateElement(this.towerId, this.element.id, body).subscribe((res: any) => {
      if (res?.anchorPoint) this.anchorPoint.set(res.anchorPoint);
      this.updated.emit();
    });
  }
}
