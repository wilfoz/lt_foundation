import { AngleDto } from './angle.dto';
import { FoundationSelectionDto, StubDto } from './foundation.dto';

export type TowerClassification = 'SELF_SUPPORTING' | 'GUYED';
export type LegId = 'A' | 'B' | 'C' | 'D';
export type ElementId = 'MC' | 'A' | 'B' | 'C' | 'D';

export interface SurveyPointDto {
  naturalElevation: number;
  concreteCastingElevation: number;
  distance: number;
}

export interface LegDto {
  id: LegId;
  foundation?: FoundationSelectionDto;
  survey?: SurveyPointDto;
  stub?: StubDto;
}

export interface StayDto {
  horizontalAngle: AngleDto;
  inclinationAngle: number;
}

/** Terrain-corrected anchor point data for a stay element. */
export interface AnchorPointDto {
  cotaPF: number;
  P5?: number;
  XCC?: number;
  /** Terrain inclination angle in radians: arctan((cotaPF - P5) / 4). */
  alfa?: number;
  adjustedNCC?: number;
  adjustedHC?: number;
  distProj?: number;
  anchorOffset?: number;
  realDistance?: number;
  cableCutLength?: number;
  terrainAdjusted: boolean;
}

export interface GuyedElementDto {
  id: ElementId;
  foundation?: FoundationSelectionDto;
  survey?: SurveyPointDto;
  stay?: StayDto;
  stub?: StubDto;
  anchorPoint?: AnchorPointDto;
}

export interface TowerDto {
  id: string;
  type: string;
  extension: number;
  Hu: number;
  classification: TowerClassification;
  deflectionAngle?: AngleDto;
  legs?: LegDto[];
  guyedElements?: GuyedElementDto[];
}

export interface CreateTowerDto {
  type: string;
  extension: number;
  Hu: number;
  classification: TowerClassification;
  deflectionAngle: AngleDto;
}
