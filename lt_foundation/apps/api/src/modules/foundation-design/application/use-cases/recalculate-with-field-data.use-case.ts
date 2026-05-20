import { Injectable, NotFoundException } from '@nestjs/common';
import { TowerRepository } from '../ports/tower.repository';
import { FieldRecalculationService, FieldMeasurements } from '../../domain/services/field-recalculation.service';
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
  ) {}

  async execute(input: RecalculateWithFieldDataInput): Promise<Tower> {
    const tower = await this.towerRepository.findById(input.towerId);
    if (!tower) throw new NotFoundException(`Tower ${input.towerId} not found`);

    if (tower.isSelfSupporting()) {
      for (const legField of input.legs ?? []) {
        const leg = tower.getLeg(legField.legId);
        if (!leg) continue;

        const foundationHeight = this.getFoundationHeight(tower, legField.legId);
        const theoretical = leg.theoreticalData ?? {};
        const result = this.recalcService.recalculateLeg(theoretical, legField.measurements, foundationHeight);

        leg.fieldData = legField.measurements;
        leg.dataSource = 'FIELD';
        leg.surveyPoint = new SurveyPoint(
          legField.measurements.naturalElevation ?? theoretical.naturalElevation ?? 0,
          legField.measurements.concreteCastingElevation ?? theoretical.concreteCastingElevation ?? 0,
          legField.measurements.distance ?? theoretical.distance ?? 0,
        );
      }
    }

    if (tower.isGuyed()) {
      for (const elField of input.elements ?? []) {
        const el = tower.getElement(elField.elementId);
        if (!el) continue;

        const theoretical = el.theoreticalData ?? {};

        if (elField.elementId === 'MC') {
          const foundationHeight = this.getElementFoundationHeight(tower, elField.elementId);
          this.recalcService.recalculateLeg(theoretical, elField.measurements, foundationHeight);
        } else {
          this.recalcService.recalculateStay(theoretical, elField.measurements, tower.Hu);
        }

        el.fieldData = elField.measurements;
        el.dataSource = 'FIELD';

        const Nc = elField.measurements.naturalElevation ?? theoretical.naturalElevation ?? 0;
        const Ncc = elField.measurements.concreteCastingElevation ?? theoretical.concreteCastingElevation ?? 0;
        const dist = elField.measurements.distance ?? theoretical.distance ?? 0;
        el.surveyPoint = new SurveyPoint(Nc, Ncc, dist);

        if (elField.measurements.stayHorizontalAngleDeg != null || elField.measurements.stayInclinationAngleDeg != null) {
          el.stay = {
            horizontalAngleDeg:
              elField.measurements.stayHorizontalAngleDeg ?? el.stay?.horizontalAngleDeg ?? 0,
            inclinationAngleDeg:
              elField.measurements.stayInclinationAngleDeg ?? el.stay?.inclinationAngleDeg ?? 0,
          };
        }
      }
    }

    tower.version += 1;
    tower.dataSource = 'RECALCULATED';

    return this.towerRepository.update(tower);
  }

  private getFoundationHeight(tower: Tower, legId: LegId): number {
    const leg = tower.getLeg(legId);
    if (!leg?.foundation) return 0;
    if (leg.foundation instanceof CaissonFoundation) {
      const g = leg.foundation.geometry;
      return g.shaftHeight + g.frustumHeight + g.baseHeight;
    }
    if (leg.foundation instanceof FootingFoundation) {
      return leg.foundation.geometry.height;
    }
    return 0;
  }

  private getElementFoundationHeight(tower: Tower, elementId: ElementId): number {
    const el = tower.getElement(elementId);
    if (!el?.foundation) return 0;
    if (el.foundation instanceof CaissonFoundation) {
      const g = el.foundation.geometry;
      return g.shaftHeight + g.frustumHeight + g.baseHeight;
    }
    if (el.foundation instanceof FootingFoundation) {
      return el.foundation.geometry.height;
    }
    return 0;
  }
}
