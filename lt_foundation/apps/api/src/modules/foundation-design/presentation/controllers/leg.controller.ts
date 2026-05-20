import { Controller, Put, Param, Body, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SelectFoundationForLegUseCase } from '../../application/use-cases/select-foundation-for-leg.use-case';
import { TowerRepository } from '../../application/ports/tower.repository';
import { SelectFoundationDto } from '../dtos/select-foundation.dto';
import { UpdateLegDto } from '../dtos/update-survey.dto';
import { SurveyPoint } from '../../domain/entities/survey-point.entity';
import { LegId } from '../../domain/entities/leg.entity';

@ApiTags('legs')
@Controller('api/v1/towers/:towerId/legs')
export class LegController {
  constructor(
    private readonly selectFoundationUseCase: SelectFoundationForLegUseCase,
    private readonly towerRepository: TowerRepository,
  ) {}

  @Put(':legId/foundation')
  @ApiOperation({ summary: 'EP-006: Select foundation for leg' })
  async selectFoundation(
    @Param('towerId') towerId: string,
    @Param('legId') legId: LegId,
    @Body() dto: SelectFoundationDto,
  ) {
    await this.selectFoundationUseCase.execute({ towerId, legId, foundationKind: dto.kind, catalogRefId: dto.catalogRefId, azimuth: dto.azimuth });
    return { legId, foundation: { kind: dto.kind, catalogRefId: dto.catalogRefId } };
  }

  @Put(':legId')
  @ApiOperation({ summary: 'Update leg survey and stub data' })
  async updateLeg(
    @Param('towerId') towerId: string,
    @Param('legId') legId: LegId,
    @Body() dto: UpdateLegDto,
  ) {
    const tower = await this.towerRepository.findById(towerId);
    if (!tower) throw new NotFoundException(`Tower ${towerId} not found`);
    const leg = tower.getLeg(legId);
    if (!leg) throw new NotFoundException(`Leg ${legId} not found`);

    if (dto.survey) {
      leg.surveyPoint = new SurveyPoint(dto.survey.naturalElevation, dto.survey.concreteCastingElevation, dto.survey.distance);
    }
    if (dto.stub) {
      leg.stub = dto.stub;
    }

    await this.towerRepository.update(tower);
    return { legId, updated: true };
  }
}
