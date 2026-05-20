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
}
