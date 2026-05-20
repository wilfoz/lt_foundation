import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiConsumes, ApiBody, ApiOperation } from '@nestjs/swagger';
import { UploadProjectDocumentUseCase } from '../../application/use-cases/upload-project-document.use-case';
import { ExtractProjectDataUseCase } from '../../application/use-cases/extract-project-data.use-case';
import { ValidateExtractedDataUseCase } from '../../application/use-cases/validate-extracted-data.use-case';
import { CommitExtractedDataUseCase } from '../../application/use-cases/commit-extracted-data.use-case';
import { ProjectDocumentRepository } from '../../application/ports/project-document.repository';
import { ExtractedDataRepository } from '../../application/ports/extracted-data.repository';
import { UploadProjectDto, ValidateExtractedDataDto } from '../dtos/upload-project.dto';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

@ApiTags('projects')
@Controller('api/v1/projects')
export class ProjectIngestionController {
  constructor(
    private readonly upload: UploadProjectDocumentUseCase,
    private readonly extract: ExtractProjectDataUseCase,
    private readonly validate: ValidateExtractedDataUseCase,
    private readonly commit: CommitExtractedDataUseCase,
    private readonly docRepo: ProjectDocumentRepository,
    private readonly extractedRepo: ExtractedDataRepository,
  ) {}

  @Post('upload')
  @ApiOperation({ summary: 'EP-012 — Upload project document (PDF/XLS/DWG)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' }, documentType: { type: 'string' }, projectType: { type: 'string' } } } })
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: MAX_FILE_SIZE })],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
    @Body() dto: UploadProjectDto,
  ) {
    return this.upload.execute({
      filename: file.originalname,
      buffer: file.buffer,
      documentType: dto.documentType,
      projectType: dto.projectType,
    });
  }

  @Post(':documentId/extract')
  @ApiOperation({ summary: 'EP-013 — Extract parameters from uploaded document' })
  async extractData(@Param('documentId') documentId: string) {
    return this.extract.execute(documentId);
  }

  @Get(':documentId/extracted-data')
  @ApiOperation({ summary: 'EP-014 — Get extracted data for human review' })
  async getExtractedData(@Param('documentId') documentId: string) {
    return this.extractedRepo.findByDocumentId(documentId);
  }

  @Patch(':documentId/extracted-data/validate')
  @ApiOperation({ summary: 'EP-015 — Submit user edits and mark data as validated' })
  async validateData(
    @Param('documentId') documentId: string,
    @Body() dto: ValidateExtractedDataDto,
  ) {
    return this.validate.execute({
      documentId,
      userEdits: dto.userEdits,
      userId: dto.userId,
    });
  }

  @Post(':documentId/commit')
  @ApiOperation({ summary: 'EP-016 — Commit validated data as Tower aggregate' })
  async commitData(@Param('documentId') documentId: string) {
    return this.commit.execute(documentId);
  }

  @Get()
  @ApiOperation({ summary: 'List all uploaded project documents' })
  async listDocuments() {
    return this.docRepo.findAll();
  }
}
