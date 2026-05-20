import { AngleService } from './angle.service';
import { Angle } from '../value-objects/angle.vo';

describe('AngleService', () => {
  const service = new AngleService();

  it('converts 60°19\'54" to decimal degrees', () => {
    const angle = new Angle(60, 19, 54);
    expect(service.toDecimalDegrees(angle)).toBeCloseTo(60.33167, 4);
  });

  it('bisector = deflection / 2', () => {
    const angle = new Angle(60, 0, 0);
    expect(service.bisector(angle)).toBeCloseTo(30, 6);
  });

  it('converts 0°0\'0" to 0 decimal degrees', () => {
    const angle = new Angle(0, 0, 0);
    expect(service.toDecimalDegrees(angle)).toBe(0);
  });

  it('toRadians: 180° = π', () => {
    const angle = new Angle(180, 0, 0);
    expect(service.toRadians(angle)).toBeCloseTo(Math.PI, 6);
  });

  it('roundtrips decimal → Angle → decimal within 1e-4', () => {
    const original = 45.5;
    const angle = service.fromDecimalDegrees(original);
    expect(service.toDecimalDegrees(angle)).toBeCloseTo(original, 4);
  });
});
