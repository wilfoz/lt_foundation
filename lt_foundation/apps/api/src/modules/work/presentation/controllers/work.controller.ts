import { Body, Controller, Get, Inject, NotFoundException, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CreateWorkUseCase } from '../../application/use-cases/create-work.use-case';
import { ListWorksUseCase } from '../../application/use-cases/list-works.use-case';
import { ArchiveWorkUseCase } from '../../application/use-cases/archive-work.use-case';
import { CreateWorkDto } from '../dtos/work.dto';
import { WORK_REPOSITORY, WorkRepositoryPort } from '../../application/ports/work.repository.port';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import { CurrentUser } from '../../../auth/presentation/decorators/current-user.decorator';
import { JwtPayload } from '../../../auth/application/ports/token-service.port';
import { WorkStatus } from '../../domain/entities/work.entity';

@ApiTags('Obras')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/obras')
export class WorkController {
  constructor(
    private readonly createWork: CreateWorkUseCase,
    private readonly listWorks: ListWorksUseCase,
    private readonly archiveWork: ArchiveWorkUseCase,
    @Inject(WORK_REPOSITORY) private readonly workRepo: WorkRepositoryPort,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar obras' })
  @ApiQuery({ name: 'status', enum: WorkStatus, required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  list(
    @Query('status') status?: WorkStatus,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.listWorks.execute({
      status,
      page: page ? Number.parseInt(page) : undefined,
      pageSize: pageSize ? Number.parseInt(pageSize) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar obra por ID' })
  async findOne(@Param('id') id: string) {
    const work = await this.workRepo.findById(id);
    if (!work) throw new NotFoundException('Obra não encontrada.');
    return work;
  }

  @Post()
  @ApiOperation({ summary: 'Criar nova obra' })
  create(@Body() dto: CreateWorkDto, @CurrentUser() user: JwtPayload) {
    return this.createWork.execute({ ...dto, userId: user.sub });
  }

  @Patch(':id/archive')
  @ApiOperation({ summary: 'Arquivar obra' })
  archive(@Param('id') id: string) {
    return this.archiveWork.execute(id);
  }
}
