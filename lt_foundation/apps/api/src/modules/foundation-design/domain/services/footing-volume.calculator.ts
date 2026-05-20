import { FootingGeometry } from '../entities/foundation.entity';

export interface FootingVolumeResult {
  totalVolume: number;
  excavationVolume: number;
}

export class FootingVolumeCalculator {
  compute(geometry: FootingGeometry, excavationAllowance = 0.1): FootingVolumeResult {
    const { length: L, width: B, height: Hs } = geometry;

    if (L <= 0 || B <= 0 || Hs <= 0) {
      throw new Error('V-411: length, width and height must be positive');
    }

    const footingVolume = L * B * Hs;
    const pedestalVolume = geometry.pedestal
      ? geometry.pedestal.length * geometry.pedestal.width * geometry.pedestal.height
      : 0;
    const totalVolume = footingVolume + pedestalVolume;
    const excavationVolume = totalVolume * (1 + excavationAllowance);

    return { totalVolume, excavationVolume };
  }
}
