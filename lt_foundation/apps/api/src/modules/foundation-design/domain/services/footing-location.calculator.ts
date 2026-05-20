import { Point2D } from '@lt/shared-dtos';

export interface FootingCorners {
  s1: Point2D;
  s2: Point2D;
  s3: Point2D;
  s4: Point2D;
}

export class FootingLocationCalculator {
  compute(centerX: number, centerY: number, length: number, width: number, azimuthDeg: number): FootingCorners {
    const theta = (azimuthDeg * Math.PI) / 180;
    const dx = length / 2;
    const dy = width / 2;
    const cosT = Math.cos(theta);
    const sinT = Math.sin(theta);

    return {
      s1: { x: centerX + dx * cosT - dy * sinT, y: centerY + dx * sinT + dy * cosT },
      s2: { x: centerX - dx * cosT - dy * sinT, y: centerY - dx * sinT + dy * cosT },
      s3: { x: centerX - dx * cosT + dy * sinT, y: centerY - dx * sinT - dy * cosT },
      s4: { x: centerX + dx * cosT + dy * sinT, y: centerY + dx * sinT - dy * cosT },
    };
  }
}
