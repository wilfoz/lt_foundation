import { ValidationResultDto } from './validation.dto';

export interface Point2D {
  x: number;
  y: number;
}

export interface CaissonVolumesDto {
  shaftVolume: number;
  frustumVolume: number;
  baseVolume: number;
  totalVolume: number;
  excavationVolume: number;
}

export interface FootingVolumesDto {
  totalVolume: number;
  excavationVolume: number;
}

export interface DepthResultDto {
  protrusion: number;
  totalDepth: number;
  concreteBottomLevel: number;
  G: number;
}

export interface ElementCalculationResultDto {
  elementId: string;
  Afl: number;
  G: number;
  H: number;
  NFC: number;
  volumes: CaissonVolumesDto | FootingVolumesDto;
  corners?: { s1: Point2D; s2: Point2D; s3: Point2D; s4: Point2D };
  stayRadialDistance?: number;
}

export interface CalculationResultDto {
  towerId: string;
  bisector: number;
  perElement: ElementCalculationResultDto[];
  validations: ValidationResultDto[];
  partial: boolean;
}

export interface SpreadsheetEmissionDto {
  towerId: string;
  format: 'XLSX' | 'PDF';
  draft: boolean;
}
