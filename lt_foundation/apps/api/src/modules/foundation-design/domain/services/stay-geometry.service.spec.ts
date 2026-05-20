import { StayGeometryService } from './stay-geometry.service';

describe('StayGeometryService', () => {
  const service = new StayGeometryService();

  it('computes R = Hu / tan(inclinationAngle)', () => {
    const R = service.computeRadialDistance(21, 45);
    expect(R).toBeCloseTo(21, 4);
  });

  it('larger inclination → smaller R', () => {
    const R60 = service.computeRadialDistance(21, 60);
    const R45 = service.computeRadialDistance(21, 45);
    expect(R60).toBeLessThan(R45);
  });

  it('throws V-205 for inclination <= 0', () => {
    expect(() => service.computeRadialDistance(21, 0)).toThrow('V-205');
    expect(() => service.computeRadialDistance(21, -10)).toThrow('V-205');
  });

  it('throws V-205 for inclination >= 90', () => {
    expect(() => service.computeRadialDistance(21, 90)).toThrow('V-205');
    expect(() => service.computeRadialDistance(21, 95)).toThrow('V-205');
  });

  it('computes correct position for horizAngle=0 (east direction)', () => {
    const result = service.computePosition(21, 45, 0);
    expect(result.position.x).toBeCloseTo(21, 3);
    expect(result.position.y).toBeCloseTo(0, 3);
  });

  it('computes correct position for horizAngle=90 (north direction)', () => {
    const result = service.computePosition(21, 45, 90);
    expect(result.position.x).toBeCloseTo(0, 3);
    expect(result.position.y).toBeCloseTo(21, 3);
  });
});
