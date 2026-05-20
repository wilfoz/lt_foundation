import { IsEnum, IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SelectFoundationDto {
  @ApiProperty({ enum: ['CAISSON', 'FOOTING'] }) @IsEnum(['CAISSON', 'FOOTING']) kind!: 'CAISSON' | 'FOOTING';
  @ApiProperty() @IsString() catalogRefId!: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) @Max(360) azimuth?: number;
}
