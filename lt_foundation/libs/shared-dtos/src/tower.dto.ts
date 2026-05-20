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

export interface GuyedElementDto {
  id: ElementId;
  foundation?: FoundationSelectionDto;
  survey?: SurveyPointDto;
  stay?: StayDto;
  stub?: StubDto;
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
