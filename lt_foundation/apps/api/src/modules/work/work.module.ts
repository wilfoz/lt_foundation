import { Module } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma.service';
import { AuthModule } from '../auth/auth.module';

import { WORK_REPOSITORY } from './application/ports/work.repository.port';
import { WORK_TOWER_REPOSITORY } from './application/ports/work-tower.repository.port';
import { PrismaWorkRepository } from './infrastructure/prisma-work.repository';
import { PrismaWorkTowerRepository } from './infrastructure/prisma-work-tower.repository';

import { CreateWorkUseCase } from './application/use-cases/create-work.use-case';
import { ListWorksUseCase } from './application/use-cases/list-works.use-case';
import { ArchiveWorkUseCase } from './application/use-cases/archive-work.use-case';
import { AddTowerToWorkUseCase } from './application/use-cases/add-tower-to-work.use-case';

import { WorkController } from './presentation/controllers/work.controller';
import { WorkTowerController } from './presentation/controllers/work-tower.controller';
import { WorkDocumentController } from './presentation/controllers/work-document.controller';
import { PrismaWorkDocumentRepository } from './infrastructure/prisma-work-document.repository';

@Module({
  imports: [AuthModule],
  controllers: [WorkController, WorkTowerController, WorkDocumentController],
  providers: [
    PrismaService,
    { provide: WORK_REPOSITORY, useClass: PrismaWorkRepository },
    { provide: WORK_TOWER_REPOSITORY, useClass: PrismaWorkTowerRepository },
    PrismaWorkDocumentRepository,
    CreateWorkUseCase,
    ListWorksUseCase,
    ArchiveWorkUseCase,
    AddTowerToWorkUseCase,
  ],
  exports: [WORK_REPOSITORY, WORK_TOWER_REPOSITORY],
})
export class WorkModule {}
