import { Angle } from '../value-objects/angle.vo';

export class AngleService {
  toDecimalDegrees(angle: Angle): number {
    return angle.deg + angle.min / 60 + angle.sec / 3600;
  }

  toRadians(angle: Angle): number {
    return (this.toDecimalDegrees(angle) * Math.PI) / 180;
  }

  fromDecimalDegrees(decimal: number, dir?: 'D' | 'E'): Angle {
    const deg = Math.floor(Math.abs(decimal));
    const minDecimal = (Math.abs(decimal) - deg) * 60;
    const min = Math.floor(minDecimal);
    const sec = parseFloat(((minDecimal - min) * 60).toFixed(4));
    return new Angle(deg, min, sec, dir);
  }

  bisector(deflectionAngle: Angle): number {
    return this.toDecimalDegrees(deflectionAngle) / 2;
  }
}
