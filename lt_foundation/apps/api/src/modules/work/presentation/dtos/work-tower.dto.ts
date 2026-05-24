import { IsString, IsNotEmpty, IsNumber, IsPositive, IsOptional, IsEnum, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddTowerToWorkDto {
  @ApiProperty({ example: 'SL' })
  @IsString() @IsNotEmpty()
  type!: string;

  @ApiProperty({ example: 6 })
  @IsNumber() @IsPositive()
  extension!: number;

  @ApiProperty({ example: 21 })
  @IsNumber() @IsPositive()
  hu!: number;

  @ApiProperty({ enum: ['SELF_SUPPORTING', 'GUYED'] })
  @IsEnum(['SELF_SUPPORTING', 'GUYED'])
  classification!: 'SELF_SUPPORTING' | 'GUYED';

  @ApiPropertyOptional()
  @IsOptional()
  deflectionAngle?: { deg: number; min: number; sec: number; dir: string };

  @ApiProperty({ example: 1 })
  @IsNumber() @Min(1)
  sequence!: number;

  @ApiPropertyOptional({ example: 'T-42' })
  @IsOptional() @IsString()
  alias?: string;
}
