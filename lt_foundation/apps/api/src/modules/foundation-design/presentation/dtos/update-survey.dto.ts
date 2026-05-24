import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSurveyDto {
  @ApiProperty() @IsNumber() naturalElevation!: number;
  @ApiProperty() @IsNumber() concreteCastingElevation!: number;
  @ApiProperty() @IsNumber() distance!: number;
}

export class UpdateStubDto {
  @ApiProperty() @IsString() type!: string;
  @ApiProperty() @IsNumber() length!: number;
  @ApiProperty() @IsNumber() embedment!: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() inclination?: number;
}

export class UpdateLegDto {
  @ApiPropertyOptional({ type: UpdateSurveyDto }) @IsOptional() survey?: UpdateSurveyDto;
  @ApiPropertyOptional({ type: UpdateStubDto }) @IsOptional() stub?: UpdateStubDto;
}

export class UpdateGuyedElementDto {
  @ApiPropertyOptional({ type: UpdateSurveyDto }) @IsOptional() survey?: UpdateSurveyDto;
  @ApiPropertyOptional({ type: UpdateStubDto }) @IsOptional() stub?: UpdateStubDto;
  @ApiPropertyOptional() @IsOptional() @IsNumber() stayHorizontalAngleDeg?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() stayInclinationAngleDeg?: number;
  /** Cota do ponto de fincamento (PF). */
  @ApiPropertyOptional({ description: 'Cota do ponto de fincamento — PF (m)' })
  @IsOptional() @IsNumber() cotaPF?: number;
  /** Cota de referência a 5 m do PF (P5) — para calcular alfa. */
  @ApiPropertyOptional({ description: 'Cota de referência a 5 m do PF — P5 (m)' })
  @IsOptional() @IsNumber() referencePoint5m?: number;
  /** Distância horizontal do MC ao ponto CC (XCC). */
  @ApiPropertyOptional({ description: 'Distância horizontal MC → CC — XCC (m)' })
  @IsOptional() @IsNumber() distanceToCC?: number;
  /** Elevação do ponto de fixação do estai no mastro. */
  @ApiPropertyOptional({ description: 'Elevação do ponto de fixação do estai no mastro (m)' })
  @IsOptional() @IsNumber() elevFixation?: number;
  /** Tangente do estai (N5SEL=0.7647, N5SEM=0.7383). */
  @ApiPropertyOptional({ description: 'Tangente do ângulo do estai' })
  @IsOptional() @IsNumber() stayTangent?: number;
}
