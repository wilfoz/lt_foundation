import { StayGeometryService } from './stay-geometry.service';

describe('StayGeometryService', () => {
  const svc = new StayGeometryService();

  // ── Theoretical ─────────────────────────────────────────────────────────────

  describe('computeRadialDistance', () => {
    it('R = Hu / tan(inclination)', () => {
      expect(svc.computeRadialDistance(21, 45)).toBeCloseTo(21, 4);
    });

    it('larger inclination → smaller R', () => {
      expect(svc.computeRadialDistance(21, 60)).toBeLessThan(svc.computeRadialDistance(21, 45));
    });

    it('throws V-205 for inclination <= 0', () => {
      expect(() => svc.computeRadialDistance(21, 0)).toThrow('V-205');
      expect(() => svc.computeRadialDistance(21, -10)).toThrow('V-205');
    });

    it('throws V-205 for inclination >= 90', () => {
      expect(() => svc.computeRadialDistance(21, 90)).toThrow('V-205');
    });
  });

  describe('computePosition', () => {
    it('horizAngle=0 → position on X axis', () => {
      const r = svc.computePosition(21, 45, 0);
      expect(r.position.x).toBeCloseTo(21, 3);
      expect(r.position.y).toBeCloseTo(0, 3);
    });

    it('horizAngle=90 → position on Y axis', () => {
      const r = svc.computePosition(21, 45, 90);
      expect(r.position.x).toBeCloseTo(0, 3);
      expect(r.position.y).toBeCloseTo(21, 3);
    });
  });

  // ── Terrain correction ───────────────────────────────────────────────────────

  describe('computeAlfa', () => {
    it('flat terrain (cotaPF = P5) → alfa = 0', () => {
      expect(svc.computeAlfa(100, 100)).toBeCloseTo(0, 8);
    });

    it('positive slope: cotaPF=101, P5=100 → alfa ≈ arctan(0.25)', () => {
      const expected = Math.atan(1 / 4);
      expect(svc.computeAlfa(101, 100)).toBeCloseTo(expected, 8);
    });

    it('negative slope: cotaPF=99, P5=100 → alfa ≈ arctan(-0.25)', () => {
      const expected = Math.atan(-1 / 4);
      expect(svc.computeAlfa(99, 100)).toBeCloseTo(expected, 8);
    });
  });

  describe('computeAdjustedNCC', () => {
    it('flat terrain (alfa=0) → NCC = cotaPF', () => {
      expect(svc.computeAdjustedNCC(0, 10, 100)).toBeCloseTo(100, 6);
    });

    it('NCC = -tan(alfa)*XCC + cotaPF', () => {
      const alfa = Math.atan(0.25); // from example above
      const result = svc.computeAdjustedNCC(alfa, 10, 100);
      expect(result).toBeCloseTo(-Math.tan(alfa) * 10 + 100, 6);
    });
  });

  describe('computeAdjustedHC', () => {
    it('flat terrain (alfa=0) → HC = cotaPF', () => {
      expect(svc.computeAdjustedHC(0, 10, 100)).toBeCloseTo(100, 6);
    });

    it('HC = cotaPF - tan(alfa)*XCC', () => {
      const alfa = Math.atan(0.25);
      const result = svc.computeAdjustedHC(alfa, 10, 100);
      expect(result).toBeCloseTo(100 - Math.tan(alfa) * 10, 6);
    });
  });

  describe('computeAnchorOffset', () => {
    it('offset = (elevFixation - cotaPF) * stayTangent', () => {
      // N5SEL: Tg = 0.7647; elevFixation=105, cotaPF=100 → 5 * 0.7647 = 3.8235
      expect(svc.computeAnchorOffset(105, 100, 0.7647)).toBeCloseTo(3.8235, 4);
    });

    it('zero offset when elevFixation = cotaPF', () => {
      expect(svc.computeAnchorOffset(100, 100, 0.7647)).toBeCloseTo(0, 6);
    });
  });

  describe('computeRealAnchorDistance', () => {
    it('realDistance = distProj + offset', () => {
      expect(svc.computeRealAnchorDistance(25, 3.8235)).toBeCloseTo(28.8235, 4);
    });
  });

  describe('computeCableLength', () => {
    it('Comp_Cabo = hypot(elevFixation - cotaPF, G) - 0.8', () => {
      // elevFixation=105, cotaPF=100, G=25 → hypot(5, 25) - 0.8 ≈ 25.495 - 0.8 = 24.695
      const expected = Math.hypot(5, 25) - 0.8;
      expect(svc.computeCableLength(105, 100, 25)).toBeCloseTo(expected, 4);
    });

    it('throws V-031 when result is <= 0', () => {
      // elevFixation very close to cotaPF and tiny G → result would be ~negative
      expect(() => svc.computeCableLength(100.1, 100, 0)).toThrow('V-031');
    });
  });

  describe('computeTerrainPipeline', () => {
    it('throws V-030 when cotaPF <= 0', () => {
      expect(() =>
        svc.computeTerrainPipeline({ cotaPF: 0, P5: 0, XCC: 5, elevFixation: 105, distProj: 25, stayTangent: 0.7647 }),
      ).toThrow('V-030');
    });

    it('flat terrain → adjustedNCC = adjustedHC = cotaPF and offset driven only by elevation diff', () => {
      const result = svc.computeTerrainPipeline({
        cotaPF: 100,
        P5: 100,   // flat → alfa = 0
        XCC: 10,
        elevFixation: 105,
        distProj: 25,
        stayTangent: 0.7647,
      });
      expect(result.alfa).toBeCloseTo(0, 8);
      expect(result.adjustedNCC).toBeCloseTo(100, 4);
      expect(result.adjustedHC).toBeCloseTo(100, 4);
      expect(result.anchorOffset).toBeCloseTo(5 * 0.7647, 4);
      expect(result.realDistance).toBeCloseTo(25 + 5 * 0.7647, 4);
    });

    it('returns a positive cableCutLength for a realistic scenario (N5SEL)', () => {
      // cotaPF=98.5, P5=98.0, XCC=10, elevFixation=100.2, distProj=25, Tg=0.7647
      const result = svc.computeTerrainPipeline({
        cotaPF: 98.5,
        P5: 98.0,
        XCC: 10,
        elevFixation: 100.2,
        distProj: 25,
        stayTangent: 0.7647,
      });
      expect(result.cableCutLength).toBeGreaterThan(0);
      expect(result.terrainAdjusted).toBeUndefined(); // terrainAdjusted set by caller, not pipeline
    });
  });
});
