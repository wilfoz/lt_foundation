import { Controller, Put, Param, Body, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SelectFoundationForElementUseCase } from '../../application/use-cases/select-foundation-for-element.use-case';
import { TowerRepository } from '../../application/ports/tower.repository';
import { StayGeometryService } from '../../domain/services/stay-geometry.service';
import { SelectFoundationDto } from '../dtos/select-foundation.dto';
import { UpdateGuyedElementDto } from '../dtos/update-survey.dto';
import { SurveyPoint } from '../../domain/entities/survey-point.entity';
import { ElementId } from '../../domain/entities/tower-element.entity';

@ApiTags('guyed')
@Controller('api/v1/towers/:towerId/elements')
export class GuyedController {
  constructor(
    private readonly selectFoundationUseCase: SelectFoundationForElementUseCase,
    private readonly towerRepository: TowerRepository,
    private readonly stayGeometry: StayGeometryService,
  ) {}

  @Put(':elementId/foundation')
  @ApiOperation({ summary: 'EP-007: Select foundation for guyed element' })
  async selectFoundation(
    @Param('towerId') towerId: string,
    @Param('elementId') elementId: ElementId,
    @Body() dto: SelectFoundationDto,
  ) {
    await this.selectFoundationUseCase.execute({ towerId, elementId, foundationKind: dto.kind, catalogRefId: dto.catalogRefId, azimuth: dto.azimuth });
    return { elementId, foundation: { kind: dto.kind, catalogRefId: dto.catalogRefId } };
  }

  @Put(':elementId')
  @ApiOperation({ summary: 'Update guyed element survey, stub, stay and terrain anchor data' })
  async updateElement(
    @Param('towerId') towerId: string,
    @Param('elementId') elementId: ElementId,
    @Body() dto: UpdateGuyedElementDto,
  ) {
    const tower = await this.towerRepository.findById(towerId);
    if (!tower) throw new NotFoundException(`Tower ${towerId} not found`);
    const el = tower.getElement(elementId);
    if (!el) throw new NotFoundException(`Element ${elementId} not found`);

    if (dto.survey) {
      el.surveyPoint = new SurveyPoint(dto.survey.naturalElevation, dto.survey.concreteCastingElevation, dto.survey.distance);
    }
    if (dto.stub) el.stub = dto.stub;
    if (dto.stayHorizontalAngleDeg != null && dto.stayInclinationAngleDeg != null) {
      el.stay = { horizontalAngleDeg: dto.stayHorizontalAngleDeg, inclinationAngleDeg: dto.stayInclinationAngleDeg };
    }

    if (elementId !== 'MC' && dto.cotaPF != null) {
      const hasFullTerrainInputs =
        dto.referencePoint5m != null &&
        dto.distanceToCC != null &&
        dto.elevFixation != null &&
        dto.stayTangent != null &&
        dto.survey?.distance != null;

      if (hasFullTerrainInputs) {
        const result = this.stayGeometry.computeTerrainPipeline({
          cotaPF: dto.cotaPF,
          P5: dto.referencePoint5m!,
          XCC: dto.distanceToCC!,
          elevFixation: dto.elevFixation!,
          distProj: dto.survey!.distance,
          stayTangent: dto.stayTangent!,
        });
        el.anchorPoint = {
          cotaPF: dto.cotaPF,
          P5: dto.referencePoint5m,
          XCC: dto.distanceToCC,
          distProj: dto.survey!.distance,
          ...result,
          terrainAdjusted: true,
        };
      } else {
        el.anchorPoint = {
          cotaPF: dto.cotaPF,
          distProj: dto.survey?.distance,
          terrainAdjusted: false,
        };
      }
    }

    await this.towerRepository.update(tower);
    return { elementId, updated: true };
  }
}
