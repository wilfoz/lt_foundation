import { FootingLocationCalculator } from './footing-location.calculator';

describe('FootingLocationCalculator', () => {
  const calc = new FootingLocationCalculator();

  it('azimuth=0: S1 and S4 are to the +x, S2 and S3 to the -x side', () => {
    const c = calc.compute(0, 0, 4, 2, 0);
    expect(c.s1.x).toBeCloseTo(2, 4);
    expect(c.s2.x).toBeCloseTo(-2, 4);
    expect(c.s3.x).toBeCloseTo(-2, 4);
    expect(c.s4.x).toBeCloseTo(2, 4);
  });

  it('azimuth=90: L is along +y axis', () => {
    const c = calc.compute(0, 0, 4, 2, 90);
    expect(c.s1.y).toBeCloseTo(2, 4);
    expect(c.s2.y).toBeCloseTo(-2, 4);
  });

  it('square footing at origin azimuth=0 has symmetric corners', () => {
    const c = calc.compute(0, 0, 2, 2, 0);
    expect(c.s1.x).toBeCloseTo(1, 4);
    expect(c.s1.y).toBeCloseTo(1, 4);
    expect(c.s3.x).toBeCloseTo(-1, 4);
    expect(c.s3.y).toBeCloseTo(-1, 4);
  });

  it('center offset is respected', () => {
    const c = calc.compute(10, 5, 2, 2, 0);
    expect(c.s1.x).toBeCloseTo(11, 4);
    expect(c.s1.y).toBeCloseTo(6, 4);
  });

  it('azimuth=180 mirrors azimuth=0', () => {
    const c0 = calc.compute(0, 0, 4, 2, 0);
    const c180 = calc.compute(0, 0, 4, 2, 180);
    expect(c0.s1.x).toBeCloseTo(-c180.s1.x, 4);
  });
});
