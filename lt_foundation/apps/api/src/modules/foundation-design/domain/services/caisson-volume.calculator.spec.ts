import { CaissonVolumeCalculator } from './caisson-volume.calculator';

describe('CaissonVolumeCalculator', () => {
  const calc = new CaissonVolumeCalculator();

  it('computes shaft volume: Vf = π * (Df²/4) * Hf', () => {
    const result = calc.compute({ shaftDiameter: 1, baseDiameter: 1.4, shaftHeight: 2, frustumHeight: 0.4, baseHeight: 0.8 });
    expect(result.shaftVolume).toBeCloseTo(Math.PI * (1 / 4) * 2, 4);
  });

  it('computes frustum volume', () => {
    const Df = 1, Db = 1.4, Htc = 0.4;
    const expected = (Math.PI * Htc / 12) * (Db ** 2 + Db * Df + Df ** 2);
    const result = calc.compute({ shaftDiameter: Df, baseDiameter: Db, shaftHeight: 2, frustumHeight: Htc, baseHeight: 0.8 });
    expect(result.frustumVolume).toBeCloseTo(expected, 4);
  });

  it('satisfies VT = Vf + Vtc + Vb', () => {
    const result = calc.compute({ shaftDiameter: 0.8, baseDiameter: 1.4, shaftHeight: 3, frustumHeight: 0.4, baseHeight: 0.8 });
    expect(result.totalVolume).toBeCloseTo(result.shaftVolume + result.frustumVolume + result.baseVolume, 4);
  });

  it('computes excavation volume = VT * (1 + allowance)', () => {
    const result = calc.compute({ shaftDiameter: 0.8, baseDiameter: 1.4, shaftHeight: 3, frustumHeight: 0.4, baseHeight: 0.8 }, 0.1);
    expect(result.excavationVolume).toBeCloseTo(result.totalVolume * 1.1, 4);
  });

  it('throws V-401 when baseDiameter < shaftDiameter', () => {
    expect(() => calc.compute({ shaftDiameter: 1.5, baseDiameter: 1.0, shaftHeight: 2, frustumHeight: 0.4, baseHeight: 0.8 }))
      .toThrow('V-401');
  });

  it('throws V-402 when height is zero or negative', () => {
    expect(() => calc.compute({ shaftDiameter: 0.8, baseDiameter: 1.4, shaftHeight: 0, frustumHeight: 0.4, baseHeight: 0.8 }))
      .toThrow('V-402');
    expect(() => calc.compute({ shaftDiameter: 0.8, baseDiameter: 1.4, shaftHeight: 3, frustumHeight: -1, baseHeight: 0.8 }))
      .toThrow('V-402');
  });

  it('known value: Df=1,Hf=2 → Vf ≈ 1.5708', () => {
    const result = calc.compute({ shaftDiameter: 1, baseDiameter: 1, shaftHeight: 2, frustumHeight: 0.01, baseHeight: 0.01 });
    expect(result.shaftVolume).toBeCloseTo(1.5708, 4);
  });
});
