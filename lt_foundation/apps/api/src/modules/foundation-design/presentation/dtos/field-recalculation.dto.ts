import { IsArray, IsEnum, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FieldMeasurementsDto {
  @ApiPropertyOptional() @IsOptional() @IsNumber() naturalElevation?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() concreteCastingElevation?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() distance?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() stayHorizontalAngleDeg?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() stayInclinationAngleDeg?: number;
  /** Cota do ponto de fincamento (campo medido). Obrigatório para correção por terreno. */
  @ApiPropertyOptional({ description: 'Cota do ponto de fincamento — PF (m)' })
  @IsOptional() @IsNumber() cotaPF?: number;
  /** Cota de referência a 5 m do PF (P5) — necessária para calcular alfa. */
  @ApiPropertyOptional({ description: 'Cota de referência a 5 m do PF — P5 (m)' })
  @IsOptional() @IsNumber() referencePoint5m?: number;
  /** Distância horizontal do MC ao ponto CC (XCC, m). */
  @ApiPropertyOptional({ description: 'Distância horizontal MC → CC — XCC (m)' })
  @IsOptional() @IsNumber() distanceToCC?: number;
  /** Elevação do ponto de fixação do estai no mastro (PC + DH, m). */
  @ApiPropertyOptional({ description: 'Elevação do ponto de fixação do estai no mastro (m)' })
  @IsOptional() @IsNumber() elevFixation?: number;
  /** Tangente do estai — fixo por tipo de torre (N5SEL=0.7647, N5SEM=0.7383). */
  @ApiPropertyOptional({ description: 'Tangente do ângulo do estai (por tipo de torre)' })
  @IsOptional() @IsNumber() stayTangent?: number;
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
