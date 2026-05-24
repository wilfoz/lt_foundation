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

/** Results of the terrain correction pipeline (Fundacao SM-VPM). */
export interface TerrainCorrectionResultDto {
  /** Terrain inclination angle in radians. */
  alfa: number;
  /** alfa converted to degrees for display. */
  alfaDeg: number;
  adjustedNCC: number;
  adjustedHC: number;
  anchorOffset: number;
  realDistance: number;
  cableCutLength: number;
  terrainAdjusted: true;
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
  terrainCorrection?: TerrainCorrectionResultDto;
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
