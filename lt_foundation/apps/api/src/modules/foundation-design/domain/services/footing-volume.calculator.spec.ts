import { FootingVolumeCalculator } from './footing-volume.calculator';

describe('FootingVolumeCalculator', () => {
  const calc = new FootingVolumeCalculator();

  it('computes V = L * B * H', () => {
    const { totalVolume } = calc.compute({ length: 2, width: 2, height: 0.6 });
    expect(totalVolume).toBeCloseTo(2.4, 4);
  });

  it('adds pedestal volume when present', () => {
    const { totalVolume } = calc.compute({ length: 2, width: 2, height: 0.6, pedestal: { length: 0.5, width: 0.5, height: 0.3 } });
    expect(totalVolume).toBeCloseTo(2.4 + 0.075, 4);
  });

  it('computes excavation volume = V * (1 + allowance)', () => {
    const { totalVolume, excavationVolume } = calc.compute({ length: 2, width: 2, height: 0.6 }, 0.1);
    expect(excavationVolume).toBeCloseTo(totalVolume * 1.1, 4);
  });

  it('throws V-411 for zero dimensions', () => {
    expect(() => calc.compute({ length: 0, width: 2, height: 0.6 })).toThrow('V-411');
    expect(() => calc.compute({ length: 2, width: 0, height: 0.6 })).toThrow('V-411');
    expect(() => calc.compute({ length: 2, width: 2, height: 0 })).toThrow('V-411');
  });

  it('throws V-411 for negative dimensions', () => {
    expect(() => calc.compute({ length: -1, width: 2, height: 0.6 })).toThrow('V-411');
  });
});
