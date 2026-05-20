import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { TowerRepository } from '../ports/tower.repository';
import { AngleService } from '../../domain/services/angle.service';
import { CaissonVolumeCalculator } from '../../domain/services/caisson-volume.calculator';
import { FootingVolumeCalculator } from '../../domain/services/footing-volume.calculator';
import { FootingLocationCalculator } from '../../domain/services/footing-location.calculator';
import { DepthCalculator } from '../../domain/services/depth.calculator';
import { StayGeometryService } from '../../domain/services/stay-geometry.service';
import { ValidationService } from '../../domain/services/validation.service';
import { CaissonFoundation, FootingFoundation } from '../../domain/entities/foundation.entity';
import { CalculationResultDto, ElementCalculationResultDto } from '@lt/shared-dtos';

@Injectable()
export class RunFoundationCalculationUseCase {
  private readonly angleService = new AngleService();
  private readonly caissonCalc = new CaissonVolumeCalculator();
  private readonly footingCalc = new FootingVolumeCalculator();
  private readonly footingLocCalc = new FootingLocationCalculator();
  private readonly depthCalc = new DepthCalculator();
  private readonly stayGeom = new StayGeometryService();
  private readonly validationService = new ValidationService();

  constructor(private readonly towerRepository: TowerRepository) {}

  async execute(towerId: string): Promise<CalculationResultDto> {
    const tower = await this.towerRepository.findById(towerId);
    if (!tower) throw new NotFoundException(`Tower ${towerId} not found`);
    if (!tower.deflectionAngle) throw new BadRequestException('PARTIAL_DESIGN: deflectionAngle missing');

    const bisector = this.angleService.bisector(tower.deflectionAngle);
    const perElement: ElementCalculationResultDto[] = [];
    const validations = this.validationService.validate(tower);

    const elements = tower.isSelfSupporting()
      ? tower.legs.map((l) => ({ id: l.id, foundation: l.foundation, survey: l.surveyPoint }))
      : tower.guyedElements.map((e) => ({ id: e.id, foundation: e.foundation, survey: e.surveyPoint, stay: e.stay }));

    for (const el of elements) {
      if (!el.foundation || !el.survey) continue;

      const foundationHeight = this.getFoundationHeight(el.foundation as CaissonFoundation | FootingFoundation);
      const depth = this.depthCalc.compute({
        naturalElevation: el.survey.naturalElevation,
        concreteCastingElevation: el.survey.concreteCastingElevation,
        foundationHeight,
        distance: el.survey.distance,
      });

      let volumes: any;
      let corners: any;
      let stayRadialDistance: number | undefined;

      if (el.foundation instanceof CaissonFoundation) {
        volumes = this.caissonCalc.compute(el.foundation.geometry);
      } else if (el.foundation instanceof FootingFoundation) {
        volumes = this.footingCalc.compute(el.foundation.geometry);
        corners = this.footingLocCalc.compute(0, 0, el.foundation.geometry.length, el.foundation.geometry.width, el.foundation.azimuth);
      }

      if ('stay' in el && el.stay && tower.isGuyed()) {
        stayRadialDistance = this.stayGeom.computeRadialDistance(tower.Hu, el.stay.inclinationAngleDeg);
      }

      perElement.push({
        elementId: el.id,
        Afl: depth.protrusion,
        G: depth.G,
        H: depth.totalDepth,
        NFC: depth.concreteBottomLevel,
        volumes,
        corners,
        stayRadialDistance,
      });
    }

    const partial = elements.some((e) => !e.foundation || !e.survey);

    return { towerId, bisector, perElement, validations, partial };
  }

  private getFoundationHeight(foundation: CaissonFoundation | FootingFoundation): number {
    if (foundation instanceof CaissonFoundation) {
      const g = foundation.geometry;
      return g.shaftHeight + g.frustumHeight + g.baseHeight;
    } else {
      const g = foundation.geometry;
      return g.height + (g.pedestal?.height ?? 0);
    }
  }
}
