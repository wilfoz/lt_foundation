export class CaissonVolumesVO {
  readonly shaftVolume: number;
  readonly frustumVolume: number;
  readonly baseVolume: number;
  readonly totalVolume: number;
  readonly excavationVolume: number;

  constructor(params: {
    shaftDiameter: number;
    baseDiameter: number;
    shaftHeight: number;
    frustumHeight: number;
    baseHeight: number;
    excavationAllowance?: number;
  }) {
    const { shaftDiameter: Df, baseDiameter: Db, shaftHeight: Hf, frustumHeight: Htc, baseHeight: Hb } = params;
    const allowance = params.excavationAllowance ?? 0.1;

    this.shaftVolume = Math.PI * ((Df ** 2) / 4) * Hf;
    this.frustumVolume = (Math.PI * Htc / 12) * (Db ** 2 + Db * Df + Df ** 2);
    this.baseVolume = Math.PI * ((Db ** 2) / 4) * Hb;
    this.totalVolume = this.shaftVolume + this.frustumVolume + this.baseVolume;
    this.excavationVolume = this.totalVolume * (1 + allowance);
  }
}
