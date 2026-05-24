import { Injectable, NotFoundException } from '@nestjs/common';
import { TowerRepository } from '../ports/tower.repository';
import { FieldRecalculationService, FieldMeasurements } from '../../domain/services/field-recalculation.service';
import { StayGeometryService } from '../../domain/services/stay-geometry.service';
import { Tower } from '../../domain/entities/tower.entity';
import { LegId } from '../../domain/entities/leg.entity';
import { ElementId } from '../../domain/entities/tower-element.entity';
import { SurveyPoint } from '../../domain/entities/survey-point.entity';
import { CaissonFoundation, FootingFoundation } from '../../domain/entities/foundation.entity';

export interface LegFieldInput {
  legId: LegId;
  measurements: FieldMeasurements;
}

export interface ElementFieldInput {
  elementId: ElementId;
  measurements: FieldMeasurements;
}

export interface RecalculateWithFieldDataInput {
  towerId: string;
  legs?: LegFieldInput[];
  elements?: ElementFieldInput[];
}

@Injectable()
export class RecalculateWithFieldDataUseCase {
  constructor(
    private readonly towerRepository: TowerRepository,
    private readonly recalcService: FieldRecalculationService,
    private readonly stayGeometry: StayGeometryService,
  ) {}

  async execute(input: RecalculateWithFieldDataInput): Promise<Tower> {
    const tower = await this.towerRepository.findById(input.towerId);
    if (!tower) throw new NotFoundException(`Tower ${input.towerId} not found`);

    if (tower.isSelfSupporting()) {
      this.applyLegFieldData(tower, input.legs ?? []);
    }

    if (tower.isGuyed()) {
      this.applyElementFieldData(tower, input.elements ?? []);
    }

    tower.version += 1;
    tower.dataSource = 'RECALCULATED';

    return this.towerRepository.update(tower);
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private applyLegFieldData(tower: Tower, legs: LegFieldInput[]): void {
    for (const legField of legs) {
      const leg = tower.getLeg(legField.legId);
      if (!leg) continue;

      const foundationHeight = this.getFoundationHeight(tower, legField.legId);
      const theoretical = leg.theoreticalData ?? {};
      this.recalcService.recalculateLeg(theoretical, legField.measurements, foundationHeight);

      leg.fieldData = legField.measurements;
      leg.dataSource = 'FIELD';
      leg.surveyPoint = new SurveyPoint(
        legField.measurements.naturalElevation ?? theoretical.naturalElevation ?? 0,
        legField.measurements.concreteCastingElevation ?? theoretical.concreteCastingElevation ?? 0,
        legField.measurements.distance ?? theoretical.distance ?? 0,
      );
    }
  }

  private applyElementFieldData(tower: Tower, elements: ElementFieldInput[]): void {
    for (const elField of elements) {
      const el = tower.getElement(elField.elementId);
      if (!el) continue;

      const theoretical = el.theoreticalData ?? {};

      if (elField.elementId === 'MC') {
        const foundationHeight = this.getElementFoundationHeight(tower, elField.elementId);
        this.recalcService.recalculateLeg(theoretical, elField.measurements, foundationHeight);
      } else {
        this.recalcService.recalculateStay(theoretical, elField.measurements, tower.Hu);
        this.applyTerrainCorrection(el, elField.measurements);
      }

      el.fieldData = elField.measurements;
      el.dataSource = 'FIELD';

      const Nc = elField.measurements.naturalElevation ?? theoretical.naturalElevation ?? 0;
      const Ncc = elField.measurements.concreteCastingElevation ?? theoretical.concreteCastingElevation ?? 0;
      const dist = elField.measurements.distance ?? theoretical.distance ?? 0;
      el.surveyPoint = new SurveyPoint(Nc, Ncc, dist);

      if (elField.measurements.stayHorizontalAngleDeg != null || elField.measurements.stayInclinationAngleDeg != null) {
        el.stay = {
          horizontalAngleDeg: elField.measurements.stayHorizontalAngleDeg ?? el.stay?.horizontalAngleDeg ?? 0,
          inclinationAngleDeg: elField.measurements.stayInclinationAngleDeg ?? el.stay?.inclinationAngleDeg ?? 0,
        };
      }
    }
  }

  /**
   * Runs the terrain correction pipeline when all required inputs are present.
   * Stores the result in el.anchorPoint (terrainAdjusted = true).
   * If inputs are incomplete, sets a partial anchorPoint with terrainAdjusted = false.
   */
  private applyTerrainCorrection(el: import('../../domain/entities/tower-element.entity').TowerElement, m: FieldMeasurements): void {
    const { cotaPF, referencePoint5m: P5, distanceToCC: XCC, elevFixation, stayTangent, distance: distProj } = m;

    if (cotaPF == null) return;

    if (P5 != null && XCC != null && elevFixation != null && stayTangent != null && distProj != null) {
      const result = this.stayGeometry.computeTerrainPipeline({
        cotaPF,
        P5,
        XCC,
        elevFixation,
        distProj,
        stayTangent,
      });
      el.anchorPoint = {
        cotaPF,
        P5,
        XCC,
        ...result,
        distProj,
        terrainAdjusted: true,
      };
    } else {
      el.anchorPoint = { cotaPF, distProj, terrainAdjusted: false };
    }
  }

  private getFoundationHeight(tower: Tower, legId: LegId): number {
    const leg = tower.getLeg(legId);
    if (!leg?.foundation) return 0;
    if (leg.foundation instanceof CaissonFoundation) {
      const g = leg.foundation.geometry;
      return g.shaftHeight + g.frustumHeight + g.baseHeight;
    }
    if (leg.foundation instanceof FootingFoundation) return leg.foundation.geometry.height;
    return 0;
  }

  private getElementFoundationHeight(tower: Tower, elementId: ElementId): number {
    const el = tower.getElement(elementId);
    if (!el?.foundation) return 0;
    if (el.foundation instanceof CaissonFoundation) {
      const g = el.foundation.geometry;
      return g.shaftHeight + g.frustumHeight + g.baseHeight;
    }
    if (el.foundation instanceof FootingFoundation) return el.foundation.geometry.height;
    return 0;
  }
}
