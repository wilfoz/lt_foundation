import { CaissonGeometry } from '../entities/foundation.entity';

export interface CaissonVolumeResult {
  shaftVolume: number;
  frustumVolume: number;
  baseVolume: number;
  totalVolume: number;
  excavationVolume: number;
}

export class CaissonVolumeCalculator {
  compute(geometry: CaissonGeometry, excavationAllowance = 0.1): CaissonVolumeResult {
    const { shaftDiameter: Df, baseDiameter: Db, shaftHeight: Hf, frustumHeight: Htc, baseHeight: Hb } = geometry;

    if (Df <= 0 || Db <= 0 || Hf <= 0 || Htc <= 0 || Hb <= 0) {
      throw new Error('V-402: all dimensions must be positive');
    }
    if (Db < Df) {
      throw new Error('V-401: baseDiameter must be >= shaftDiameter');
    }

    const shaftVolume = Math.PI * ((Df ** 2) / 4) * Hf;
    const frustumVolume = (Math.PI * Htc / 12) * (Db ** 2 + Db * Df + Df ** 2);
    const baseVolume = Math.PI * ((Db ** 2) / 4) * Hb;
    const totalVolume = shaftVolume + frustumVolume + baseVolume;
    const excavationVolume = totalVolume * (1 + excavationAllowance);

    return { shaftVolume, frustumVolume, baseVolume, totalVolume, excavationVolume };
  }
}
