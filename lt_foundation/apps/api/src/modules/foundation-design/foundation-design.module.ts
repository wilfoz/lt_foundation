import { Module } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma.service';

// Ports
import { TowerRepository } from './application/ports/tower.repository';
import { FoundationCatalogRepository } from './application/ports/foundation-catalog.repository';
import { SpreadsheetExporterPort } from './application/ports/spreadsheet-exporter.port';

// Use Cases
import { CreateTowerUseCase } from './application/use-cases/create-tower.use-case';
import { SelectFoundationForLegUseCase } from './application/use-cases/select-foundation-for-leg.use-case';
import { SelectFoundationForElementUseCase } from './application/use-cases/select-foundation-for-element.use-case';
import { RunFoundationCalculationUseCase } from './application/use-cases/run-foundation-calculation.use-case';
import { EmitSpreadsheetUseCase } from './application/use-cases/emit-spreadsheet.use-case';
import { ListFoundationCatalogUseCase } from './application/use-cases/list-foundation-catalog.use-case';

// Infrastructure Adapters
import { PrismaTowerRepository } from './infrastructure/persistence/prisma-tower.repository';
import { PrismaFoundationCatalogRepository } from './infrastructure/persistence/prisma-foundation-catalog.repository';
import { ExcelSpreadsheetAdapter } from './infrastructure/export/excel-spreadsheet.adapter';

// Presentation
import { TowerController } from './presentation/controllers/tower.controller';
import { LegController } from './presentation/controllers/leg.controller';
import { GuyedController } from './presentation/controllers/guyed.controller';
import { CalculationController } from './presentation/controllers/calculation.controller';
import { FoundationCatalogController } from './presentation/controllers/catalog.controller';
import { FieldRecalculationController } from './presentation/controllers/field-recalculation.controller';

// New domain services and use cases
import { FieldRecalculationService } from './domain/services/field-recalculation.service';
import { RecalculateWithFieldDataUseCase } from './application/use-cases/recalculate-with-field-data.use-case';

@Module({
  controllers: [
    TowerController,
    LegController,
    GuyedController,
    CalculationController,
    FoundationCatalogController,
    FieldRecalculationController,
  ],
  providers: [
    PrismaService,
    { provide: TowerRepository, useClass: PrismaTowerRepository },
    { provide: FoundationCatalogRepository, useClass: PrismaFoundationCatalogRepository },
    { provide: SpreadsheetExporterPort, useClass: ExcelSpreadsheetAdapter },
    CreateTowerUseCase,
    SelectFoundationForLegUseCase,
    SelectFoundationForElementUseCase,
    RunFoundationCalculationUseCase,
    EmitSpreadsheetUseCase,
    ListFoundationCatalogUseCase,
    FieldRecalculationService,
    RecalculateWithFieldDataUseCase,
  ],
  exports: [TowerRepository, FoundationCatalogRepository],
})
export class FoundationDesignModule {}
