import { IsArray, IsEnum, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FieldMeasurementsDto {
  @ApiPropertyOptional() @IsOptional() @IsNumber() naturalElevation?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() concreteCastingElevation?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() distance?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() stayHorizontalAngleDeg?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() stayInclinationAngleDeg?: number;
}

export class LegFieldInputDto {
  @ApiProperty({ enum: ['A', 'B', 'C', 'D'] })
  @IsEnum(['A', 'B', 'C', 'D'])
  legId!: 'A' | 'B' | 'C' | 'D';

  @ApiProperty({ type: FieldMeasurementsDto })
  @ValidateNested()
  @Type(() => FieldMeasurementsDto)
  measurements!: FieldMeasurementsDto;
}

export class ElementFieldInputDto {
  @ApiProperty({ enum: ['MC', 'A', 'B', 'C', 'D'] })
  @IsEnum(['MC', 'A', 'B', 'C', 'D'])
  elementId!: 'MC' | 'A' | 'B' | 'C' | 'D';

  @ApiProperty({ type: FieldMeasurementsDto })
  @ValidateNested()
  @Type(() => FieldMeasurementsDto)
  measurements!: FieldMeasurementsDto;
}

export class RecalculateWithFieldDataDto {
  @ApiPropertyOptional({ type: [LegFieldInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LegFieldInputDto)
  legs?: LegFieldInputDto[];

  @ApiPropertyOptional({ type: [ElementFieldInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ElementFieldInputDto)
  elements?: ElementFieldInputDto[];
}
