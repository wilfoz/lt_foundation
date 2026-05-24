import {
  Controller,
  Get,
  Post,
  Param,
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiConsumes, ApiBody, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../../../auth/presentation/decorators/current-user.decorator';
import { JwtPayload } from '../../../auth/application/ports/token-service.port';
import { PrismaWorkDocumentRepository, DocumentFileType } from '../../infrastructure/prisma-work-document.repository';

const ALLOWED_TYPES: Record<string, DocumentFileType> = {
  'application/pdf': 'PDF',
  'application/vnd.ms-excel': 'XLS',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLS',
  'application/octet-stream': 'DWG',
  'image/vnd.dwg': 'DWG',
};

const MAX_SIZE = 20 * 1024 * 1024;

@ApiTags('Obras - Documentos')
@ApiBearerAuth()
@Controller('api/v1/obras/:workId/documentos')
export class WorkDocumentController {
  constructor(private readonly repo: PrismaWorkDocumentRepository) {}

  @Get()
  @ApiOperation({ summary: 'Lista documentos de uma obra' })
  list(@Param('workId') workId: string) {
    return this.repo.findByWorkId(workId);
  }

  @Post()
  @ApiOperation({ summary: 'Envia documento para pipeline de ingestão' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
      required: ['file'],
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @Param('workId') workId: string,
    @UploadedFile(new ParseFilePipe({ validators: [new MaxFileSizeValidator({ maxSize: MAX_SIZE })], fileIsRequired: true }))
    file: Express.Multer.File,
    @CurrentUser() user: JwtPayload,
  ) {
    const fileType = ALLOWED_TYPES[file.mimetype];
    if (!fileType) {
      throw new BadRequestException('Tipo de arquivo não suportado. Use PDF, XLS ou DWG.');
    }
    return this.repo.create({
      workId,
      fileName: file.originalname,
      fileType,
      buffer: file.buffer,
      uploadedById: user.sub,
    });
  }
}
