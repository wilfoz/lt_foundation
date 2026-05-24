import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import { AddTowerToWorkUseCase } from '../../application/use-cases/add-tower-to-work.use-case';
import { WorkTowerRepositoryPort, WORK_TOWER_REPOSITORY } from '../../application/ports/work-tower.repository.port';
import { Inject } from '@nestjs/common';
import { AddTowerToWorkDto } from '../dtos/work-tower.dto';

@ApiTags('Obras')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/obras/:workId/torres')
export class WorkTowerController {
  constructor(
    private readonly addTowerUseCase: AddTowerToWorkUseCase,
    @Inject(WORK_TOWER_REPOSITORY) private readonly workTowerRepo: WorkTowerRepositoryPort,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar torres de uma obra' })
  list(@Param('workId') workId: string) {
    return this.workTowerRepo.findByWork(workId);
  }

  @Post()
  @ApiOperation({ summary: 'Adicionar torre à obra' })
  add(@Param('workId') workId: string, @Body() dto: AddTowerToWorkDto) {
    return this.addTowerUseCase.execute({ workId, ...dto });
  }
}
