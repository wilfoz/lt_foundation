export class FootingVolumesVO {
  readonly totalVolume: number;
  readonly excavationVolume: number;

  constructor(params: {
    length: number;
    width: number;
    height: number;
    pedestal?: { length: number; width: number; height: number };
    excavationAllowance?: number;
  }) {
    const { length: L, width: B, height: Hs } = params;
    const allowance = params.excavationAllowance ?? 0.1;

    const footingVolume = L * B * Hs;
    const pedestalVolume = params.pedestal
      ? params.pedestal.length * params.pedestal.width * params.pedestal.height
      : 0;

    this.totalVolume = footingVolume + pedestalVolume;
    this.excavationVolume = this.totalVolume * (1 + allowance);
  }
}
