export interface DepthInput {
  naturalElevation: number;
  concreteCastingElevation: number;
  foundationHeight: number;
  distance: number;
}

export interface DepthResult {
  protrusion: number;
  totalDepth: number;
  concreteBottomLevel: number;
  G: number;
}

export class DepthCalculator {
  compute(input: DepthInput): DepthResult {
    const { naturalElevation: Nc, concreteCastingElevation: Ncc, foundationHeight: H, distance } = input;
    const protrusion = Nc - Ncc;
    const concreteBottomLevel = Ncc - H;
    const G = protrusion + distance;
    return { protrusion, totalDepth: H, concreteBottomLevel, G };
  }
}
