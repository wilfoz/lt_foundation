import { Point2D } from '@lt/shared-dtos';

export interface StayPositionResult {
  radialDistance: number;
  position: Point2D;
}

export class StayGeometryService {
  computeRadialDistance(Hu: number, inclinationAngleDeg: number): number {
    if (inclinationAngleDeg <= 0 || inclinationAngleDeg >= 90) {
      throw new Error('V-205: inclination angle must be in (0°, 90°)');
    }
    const incRad = (inclinationAngleDeg * Math.PI) / 180;
    return Hu / Math.tan(incRad);
  }

  computePosition(
    Hu: number,
    inclinationAngleDeg: number,
    horizontalAngleDeg: number,
  ): StayPositionResult {
    const R = this.computeRadialDistance(Hu, inclinationAngleDeg);
    const thetaRad = (horizontalAngleDeg * Math.PI) / 180;
    return {
      radialDistance: R,
      position: {
        x: Math.cos(thetaRad) * R,
        y: Math.sin(thetaRad) * R,
      },
    };
  }
}
