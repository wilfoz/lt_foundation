import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { PrismaService } from '../../shared/prisma.service';
import { FoundationDesignModule } from '../foundation-design/foundation-design.module';

// Domain services
import { DataNormalizerService } from './domain/services/data-normalizer.service';

// Application ports (abstract tokens)
import { DocumentStoragePort } from './application/ports/document-storage.port';
import { DocumentParserPort } from './application/ports/document-parser.port';
import { ProjectDocumentRepository } from './application/ports/project-document.repository';
import { ExtractedDataRepository } from './application/ports/extracted-data.repository';

// Use cases
import { UploadProjectDocumentUseCase } from './application/use-cases/upload-project-document.use-case';
import { ExtractProjectDataUseCase } from './application/use-cases/extract-project-data.use-case';
import { ValidateExtractedDataUseCase } from './application/use-cases/validate-extracted-data.use-case';
import { CommitExtractedDataUseCase } from './application/use-cases/commit-extracted-data.use-case';

// Infrastructure adapters
import { LocalFileStorageAdapter } from './infrastructure/storage/local-file-storage.adapter';
import { XlsParserAdapter } from './infrastructure/parsers/xls-parser.adapter';
import { PdfParserAdapter } from './infrastructure/parsers/pdf-parser.adapter';
import { CompositeDocumentParserAdapter } from './infrastructure/parsers/composite-document-parser.adapter';
import { PrismaProjectDocumentRepository } from './infrastructure/persistence/prisma-project-document.repository';
import { PrismaExtractedDataRepository } from './infrastructure/persistence/prisma-extracted-data.repository';

// Presentation
import { ProjectIngestionController } from './presentation/controllers/project-ingestion.controller';

@Module({
  imports: [
    FoundationDesignModule,
    MulterModule.register({ storage: memoryStorage() }),
  ],
  controllers: [ProjectIngestionController],
  providers: [
    PrismaService,
    DataNormalizerService,
    XlsParserAdapter,
    PdfParserAdapter,
    { provide: DocumentStoragePort, useClass: LocalFileStorageAdapter },
    { provide: DocumentParserPort, useClass: CompositeDocumentParserAdapter },
    { provide: ProjectDocumentRepository, useClass: PrismaProjectDocumentRepository },
    { provide: ExtractedDataRepository, useClass: PrismaExtractedDataRepository },
    UploadProjectDocumentUseCase,
    ExtractProjectDataUseCase,
    ValidateExtractedDataUseCase,
    CommitExtractedDataUseCase,
  ],
})
export class ProjectIngestionModule {}
