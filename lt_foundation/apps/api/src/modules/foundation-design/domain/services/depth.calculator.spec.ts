import { DepthCalculator } from './depth.calculator';

describe('DepthCalculator', () => {
  const calc = new DepthCalculator();

  it('computes protrusion (Afl) = Nc - Ncc', () => {
    const r = calc.compute({ naturalElevation: 102, concreteCastingElevation: 100, foundationHeight: 3, distance: 2 });
    expect(r.protrusion).toBeCloseTo(2, 4);
  });

  it('computes NFC = Ncc - H', () => {
    const r = calc.compute({ naturalElevation: 102, concreteCastingElevation: 100, foundationHeight: 4.2, distance: 2.5 });
    expect(r.concreteBottomLevel).toBeCloseTo(95.8, 4);
  });

  it('computes G = Afl + distance', () => {
    const r = calc.compute({ naturalElevation: 102, concreteCastingElevation: 100, foundationHeight: 3, distance: 2.5 });
    expect(r.G).toBeCloseTo(4.5, 4);
  });

  it('returns totalDepth = foundationHeight', () => {
    const r = calc.compute({ naturalElevation: 102, concreteCastingElevation: 100, foundationHeight: 3, distance: 2 });
    expect(r.totalDepth).toBe(3);
  });

  it('handles negative Afl (Nc < Ncc)', () => {
    const r = calc.compute({ naturalElevation: 99, concreteCastingElevation: 100, foundationHeight: 3, distance: 2 });
    expect(r.protrusion).toBeCloseTo(-1, 4);
  });
});
