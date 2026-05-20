export class DepthVO {
  readonly protrusion: number;
  readonly totalDepth: number;
  readonly concreteBottomLevel: number;
  readonly G: number;

  constructor(params: {
    naturalElevation: number;
    concreteCastingElevation: number;
    foundationHeight: number;
    distance: number;
  }) {
    const { naturalElevation, concreteCastingElevation, foundationHeight, distance } = params;
    this.protrusion = naturalElevation - concreteCastingElevation;
    this.totalDepth = foundationHeight;
    this.concreteBottomLevel = concreteCastingElevation - foundationHeight;
    this.G = this.protrusion + distance;
  }
}
