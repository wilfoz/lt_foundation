export class Angle {
  constructor(
    readonly deg: number,
    readonly min: number,
    readonly sec: number,
    readonly dir?: 'D' | 'E',
  ) {
    if (deg < 0 || min < 0 || min >= 60 || sec < 0 || sec >= 60) {
      throw new Error(`Invalid angle: ${deg}° ${min}' ${sec}"`);
    }
  }

  toDecimalDegrees(): number {
    return this.deg + this.min / 60 + this.sec / 3600;
  }

  toRadians(): number {
    return (this.toDecimalDegrees() * Math.PI) / 180;
  }

  static fromDecimalDegrees(decimal: number, dir?: 'D' | 'E'): Angle {
    const deg = Math.floor(decimal);
    const minDecimal = (decimal - deg) * 60;
    const min = Math.floor(minDecimal);
    const sec = (minDecimal - min) * 60;
    return new Angle(deg, min, parseFloat(sec.toFixed(4)), dir);
  }
}
