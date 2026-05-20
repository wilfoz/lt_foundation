import { IsEnum, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DocumentType, ProjectType } from '../../domain/entities/project-document.entity';

export class UploadProjectDto {
  @ApiProperty({ enum: ['PDF', 'XLS', 'DWG'] })
  @IsEnum(['PDF', 'XLS', 'DWG'])
  documentType!: DocumentType;

  @ApiProperty({
    enum: ['GUYED_HEIGHT_LOCATION', 'GUYED_FOUNDATION', 'SELF_SUPPORTING_STUBS', 'SELF_SUPPORTING_FOUNDATION'],
  })
  @IsEnum(['GUYED_HEIGHT_LOCATION', 'GUYED_FOUNDATION', 'SELF_SUPPORTING_STUBS', 'SELF_SUPPORTING_FOUNDATION'])
  projectType!: ProjectType;
}

export class ValidateExtractedDataDto {
  @ApiProperty({ description: 'JSON patch: path → value of user corrections' })
  userEdits!: Record<string, unknown>;

  @ApiProperty()
  @IsString()
  userId!: string;
}
