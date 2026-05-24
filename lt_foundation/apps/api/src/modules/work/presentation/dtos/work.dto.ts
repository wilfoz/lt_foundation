import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WorkStatus } from '../../domain/entities/work.entity';

export class CreateWorkDto {
  @ApiProperty({ example: 'LT 500kV Xingu – Estreito' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'LT-500-XIN-001' })
  @IsString()
  @IsNotEmpty()
  contractNumber!: string;

  @ApiPropertyOptional({ example: 'Pará / Maranhão' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class WorkStatusDto {
  @ApiProperty({ enum: WorkStatus })
  @IsEnum(WorkStatus)
  status!: WorkStatus;
}
