export type FoundationKind = 'CAISSON' | 'FOOTING';

export type FoundationTypeCode = 'TM' | 'TE' | 'TR' | 'S' | 'SM' | 'VE';

export const FOUNDATION_TYPE_KIND_MAP: Record<FoundationTypeCode, FoundationKind> = {
  TM: 'CAISSON',
  TE: 'CAISSON',
  TR: 'CAISSON',
  S: 'FOOTING',
  SM: 'FOOTING',
  VE: 'CAISSON',
};

export interface Stub {
  type: string;
  length: number;
  embedment: number;
  inclination?: number;
}

export abstract class Foundation {
  abstract readonly kind: FoundationKind;
  catalogRefId?: string;
}

export interface CaissonGeometry {
  shaftDiameter: number;
  baseDiameter: number;
  shaftHeight: number;
  frustumHeight: number;
  baseHeight: number;
}

export interface FootingGeometry {
  length: number;
  width: number;
  height: number;
  pedestal?: { length: number; width: number; height: number };
}

export class CaissonFoundation extends Foundation {
  readonly kind = 'CAISSON' as const;
  constructor(
    public geometry: CaissonGeometry,
    catalogRefId?: string,
  ) {
    super();
    this.catalogRefId = catalogRefId;
    if (geometry.baseDiameter < geometry.shaftDiameter) {
      throw new Error('V-401: baseDiameter must be >= shaftDiameter');
    }
    if (geometry.shaftHeight <= 0 || geometry.frustumHeight <= 0 || geometry.baseHeight <= 0) {
      throw new Error('V-402: all height dimensions must be > 0');
    }
  }
}

export class FootingFoundation extends Foundation {
  readonly kind = 'FOOTING' as const;
  constructor(
    public geometry: FootingGeometry,
    public azimuth: number = 0,
    catalogRefId?: string,
  ) {
    super();
    this.catalogRefId = catalogRefId;
    if (geometry.length <= 0 || geometry.width <= 0 || geometry.height <= 0) {
      throw new Error('V-411: length, width and height must be > 0');
    }
    if (geometry.pedestal) {
      if (geometry.pedestal.length > geometry.length || geometry.pedestal.width > geometry.width) {
        throw new Error('V-412: pedestal must fit inside footing');
      }
    }
    if (azimuth < 0 || azimuth >= 360) {
      throw new Error('V-413: azimuth must be in [0, 360)');
    }
  }
}
