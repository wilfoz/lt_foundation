import { Component, signal, computed, inject, OnInit, effect } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TowerApiService } from '../../core/services/tower-api.service';
import { TowerDto, CalculationResultDto, ValidationResultDto } from '@lt/shared-dtos';
import { LegFoundationCardComponent } from './leg-foundation-card.component';
import { GuyedElementCardComponent } from './guyed-element-card.component';
import { ValidationBadgeComponent } from '../../shared/components/validation-badge.component';

@Component({
  selector: 'lt-foundation-design',
  standalone: true,
  imports: [LegFoundationCardComponent, GuyedElementCardComponent, ValidationBadgeComponent],
  template: `
    <div>
      @if (loading()) {
        <div class="text-center py-16 text-gray-500">Carregando torre...</div>
      }

      @if (tower()) {
        <div class="space-y-6">
          <!-- Header -->
          <div class="flex items-start justify-between">
            <div>
              <h1 class="text-2xl font-bold text-gray-900">
                Torre {{ tower()!.type }} — Ext. {{ tower()!.extension }}
              </h1>
              <p class="text-gray-500 mt-1">
                Hu: {{ tower()!.Hu }} m &nbsp;|&nbsp;
                {{ tower()!.classification === 'SELF_SUPPORTING' ? 'Autoportante' : 'Estaiada' }}
              </p>
              @if (bisector()) {
                <p class="text-sm text-blue-700 mt-1">Bissetriz: {{ bisector() }}°</p>
              }
            </div>
            <div class="flex gap-2">
              <button (click)="runCalculation()" [disabled]="calculating()"
                class="bg-primary text-white px-4 py-2 rounded-md text-sm hover:bg-primary-dark disabled:opacity-60 transition-colors">
                {{ calculating() ? 'Calculando...' : 'Calcular' }}
              </button>
              <button (click)="downloadDraft()" class="border border-gray-300 px-4 py-2 rounded-md text-sm hover:bg-gray-50 transition-colors">
                Rascunho XLSX
              </button>
              <button (click)="downloadFinal()" [disabled]="hasBlockers()"
                class="bg-success text-white px-4 py-2 rounded-md text-sm hover:opacity-90 disabled:opacity-60 transition-colors">
                Emitir Final
              </button>
            </div>
          </div>

          <!-- Draft banner -->
          @if (hasBlockers()) {
            <div class="bg-yellow-50 border border-yellow-300 text-yellow-800 px-4 py-3 rounded-md flex items-center gap-2">
              <span class="font-semibold">RASCUNHO</span>
              — Existem validações bloqueantes. A emissão final está desabilitada.
            </div>
          }

          <!-- Calculation error -->
          @if (calcError()) {
            <div class="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-md">{{ calcError() }}</div>
          }

          <!-- Self-supporting: 4 legs in grid -->
          @if (tower()!.classification === 'SELF_SUPPORTING') {
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
              @for (leg of tower()!.legs ?? []; track leg.id) {
                <lt-leg-foundation-card
                  [towerId]="tower()!.id"
                  [leg]="leg"
                  [calculationResult]="legResult(leg.id)"
                  [validations]="legValidations(leg.id)"
                  (updated)="onLegUpdated()"
                />
              }
            </div>
          }

          <!-- Guyed: MC center + 4 stays -->
          @if (tower()!.classification === 'GUYED') {
            <div class="space-y-4">
              @if (mcElement()) {
                <div class="max-w-sm mx-auto">
                  <p class="text-center text-xs text-gray-500 mb-2 font-medium uppercase">Mastro Central</p>
                  <lt-guyed-element-card
                    [towerId]="tower()!.id"
                    [element]="mcElement()!"
                    [calculationResult]="legResult('MC')"
                    [validations]="legValidations('MC')"
                    (updated)="onLegUpdated()"
                  />
                </div>
              }
              <p class="text-center text-xs text-gray-500 font-medium uppercase mt-2">Estais</p>
              <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
                @for (el of stayElements(); track el.id) {
                  <lt-guyed-element-card
                    [towerId]="tower()!.id"
                    [element]="el"
                    [calculationResult]="legResult(el.id)"
                    [validations]="legValidations(el.id)"
                    (updated)="onLegUpdated()"
                  />
                }
              </div>
            </div>
          }

          <!-- Global validations panel -->
          @if (calculation()) {
            <div class="bg-white border border-gray-200 rounded-lg p-4">
              <h3 class="font-semibold text-gray-700 mb-3">Validações Globais</h3>
              @if (calculation()!.validations.length === 0) {
                <p class="text-success text-sm">Todas as validações passaram.</p>
              }
              @for (v of calculation()!.validations; track v.id) {
                <lt-validation-badge [validation]="v" />
              }
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class FoundationDesignComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(TowerApiService);

  tower = signal<TowerDto | null>(null);
  loading = signal(true);
  calculation = signal<CalculationResultDto | null>(null);
  calculating = signal(false);
  calcError = signal<string | null>(null);

  bisector = computed(() => this.calculation()?.bisector?.toFixed(6) ?? null);
  hasBlockers = computed(() =>
    (this.calculation()?.validations ?? []).some((v: ValidationResultDto) => v.severity === 'BLOCKING'),
  );

  mcElement = computed(() => this.tower()?.guyedElements?.find((e) => e.id === 'MC') ?? null);
  stayElements = computed(() => this.tower()?.guyedElements?.filter((e) => e.id !== 'MC') ?? []);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.api.getTower(id).subscribe({
      next: (t) => { this.tower.set(t); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  runCalculation() {
    if (!this.tower()) return;
    this.calculating.set(true);
    this.calcError.set(null);
    this.api.calculate(this.tower()!.id).subscribe({
      next: (result) => { this.calculation.set(result); this.calculating.set(false); },
      error: (err) => { this.calcError.set(err.error?.message ?? 'Erro ao calcular.'); this.calculating.set(false); },
    });
  }

  legResult(elementId: string) {
    return this.calculation()?.perElement.find((e) => e.elementId === elementId) ?? null;
  }

  legValidations(elementId: string): ValidationResultDto[] {
    return (this.calculation()?.validations ?? []).filter((v) => v.elementId === elementId);
  }

  onLegUpdated() {
    const id = this.tower()?.id;
    if (id) {
      this.api.getTower(id).subscribe((t) => this.tower.set(t));
    }
  }

  downloadDraft() {
    this.api.downloadSpreadsheet(this.tower()!.id, true).subscribe((blob) => this.saveBlob(blob, 'rascunho.xlsx'));
  }

  downloadFinal() {
    this.api.downloadSpreadsheet(this.tower()!.id, false).subscribe((blob) => this.saveBlob(blob, 'planilha-final.xlsx'));
  }

  private saveBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
