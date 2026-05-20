export type FoundationKind = 'CAISSON' | 'FOOTING';

export interface CaissonGeometryDto {
  shaftDiameter: number;
  baseDiameter: number;
  shaftHeight: number;
  frustumHeight: number;
  baseHeight: number;
}

export interface FootingGeometryDto {
  length: number;
  width: number;
  height: number;
  pedestal?: { length: number; width: number; height: number };
}

export interface FoundationCatalogItemDto {
  catalogRefId: string;
  kind: FoundationKind;
  geometry: CaissonGeometryDto | FootingGeometryDto;
  reinforcement: null;
}

export interface FoundationSelectionDto {
  kind: FoundationKind;
  catalogRefId: string;
}

export interface StubDto {
  type: string;
  length: number;
  embedment: number;
  inclination?: number;
}
