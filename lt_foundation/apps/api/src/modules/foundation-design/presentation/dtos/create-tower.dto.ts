import { IsString, IsNumber, IsEnum, ValidateNested, IsInt, Min, Max, IsOptional, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AngleInputDto {
  @ApiProperty() @IsInt() @Min(0) @Max(359) deg!: number;
  @ApiProperty() @IsInt() @Min(0) @Max(59) min!: number;
  @ApiProperty() @IsNumber() @Min(0) sec!: number;
  @ApiPropertyOptional({ enum: ['D', 'E'] }) @IsOptional() @IsIn(['D', 'E']) dir?: 'D' | 'E';
}

export class CreateTowerInputDto {
  @ApiProperty() @IsString() type!: string;
  @ApiProperty() @IsNumber() extension!: number;
  @ApiProperty() @IsNumber() @Min(0) Hu!: number;
  @ApiProperty({ enum: ['SELF_SUPPORTING', 'GUYED'] }) @IsEnum(['SELF_SUPPORTING', 'GUYED']) classification!: 'SELF_SUPPORTING' | 'GUYED';
  @ApiProperty({ type: AngleInputDto }) @ValidateNested() @Type(() => AngleInputDto) deflectionAngle!: AngleInputDto;
}
