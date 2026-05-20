import { Tower } from './tower.entity';
import { Angle } from '../value-objects/angle.vo';

const angle = new Angle(0, 0, 0);

describe('Tower entity — SelfSupportingTower invariants (RN-101)', () => {
  it('creates exactly 4 legs A B C D', () => {
    const t = new Tower({ id: '1', type: 'SL', extension: 6, Hu: 21, classification: 'SELF_SUPPORTING', deflectionAngle: angle });
    expect(t.legs).toHaveLength(4);
    expect(t.legs.map((l) => l.id)).toEqual(['A', 'B', 'C', 'D']);
  });

  it('isSelfSupporting() = true for SELF_SUPPORTING', () => {
    const t = new Tower({ id: '1', type: 'SL', extension: 6, Hu: 21, classification: 'SELF_SUPPORTING' });
    expect(t.isSelfSupporting()).toBe(true);
    expect(t.isGuyed()).toBe(false);
  });

  it('canCalculate() = false when legs have no foundation', () => {
    const t = new Tower({ id: '1', type: 'SL', extension: 6, Hu: 21, classification: 'SELF_SUPPORTING', deflectionAngle: angle });
    expect(t.canCalculate()).toBe(false);
  });
});

describe('Tower entity — GuyedTower invariants (RN-201)', () => {
  it('creates 1 MC + 4 stays', () => {
    const t = new Tower({ id: '1', type: 'SY', extension: 3, Hu: 30, classification: 'GUYED', deflectionAngle: angle });
    expect(t.guyedElements).toHaveLength(5);
    expect(t.guyedElements.map((e) => e.id)).toContain('MC');
    const stays = t.guyedElements.filter((e) => e.id !== 'MC');
    expect(stays).toHaveLength(4);
  });

  it('isGuyed() = true for GUYED', () => {
    const t = new Tower({ id: '1', type: 'SY', extension: 3, Hu: 30, classification: 'GUYED' });
    expect(t.isGuyed()).toBe(true);
    expect(t.isSelfSupporting()).toBe(false);
  });

  it('getLeg() returns undefined for guyed tower', () => {
    const t = new Tower({ id: '1', type: 'SY', extension: 3, Hu: 30, classification: 'GUYED' });
    expect(t.getLeg('A')).toBeUndefined();
  });
});
