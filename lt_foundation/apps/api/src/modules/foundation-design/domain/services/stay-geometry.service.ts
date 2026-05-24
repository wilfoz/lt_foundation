import { Point2D } from '@lt/shared-dtos';

export interface StayPositionResult {
  radialDistance: number;
  position: Point2D;
}

export interface TerrainPipelineInput {
  cotaPF: number;
  P5: number;
  XCC: number;
  elevFixation: number;
  distProj: number;
  stayTangent: number;
}

export interface TerrainPipelineResult {
  /** Terrain inclination angle in radians: arctan((cotaPF - P5) / 4) */
  alfa: number;
  /** Adjusted NCC: -tan(alfa) * XCC + cotaPF */
  adjustedNCC: number;
  /** Adjusted HC: cotaPF - tan(alfa) * XCC */
  adjustedHC: number;
  /** Anchor offset: (elevFixation - cotaPF) * stayTangent */
  anchorOffset: number;
  /** Real anchor distance: distProj + anchorOffset */
  realDistance: number;
  /** Cable cut length: sqrt((elevFixation - cotaPF)^2 + G^2) - 0.8 */
  cableCutLength: number;
}

export class StayGeometryService {
  // ── Theoretical (seed from Tab. Alt. Torres) ────────────────────────────────

  computeRadialDistance(Hu: number, inclinationAngleDeg: number): number {
    if (inclinationAngleDeg <= 0 || inclinationAngleDeg >= 90) {
      throw new Error('V-205: inclination angle must be in (0°, 90°)');
    }
    const incRad = (inclinationAngleDeg * Math.PI) / 180;
    return Hu / Math.tan(incRad);
  }

  computePosition(
    Hu: number,
    inclinationAngleDeg: number,
    horizontalAngleDeg: number,
  ): StayPositionResult {
    const R = this.computeRadialDistance(Hu, inclinationAngleDeg);
    const thetaRad = (horizontalAngleDeg * Math.PI) / 180;
    return {
      radialDistance: R,
      position: {
        x: Math.cos(thetaRad) * R,
        y: Math.sin(thetaRad) * R,
      },
    };
  }

  // ── Terrain correction pipeline (Fundacao SM-VPM) ───────────────────────────

  /**
   * alfa = arctan((cotaPF - P5) / 4)
   * P5 = reference elevation measured 5 m from the anchor point toward the MC.
   */
  computeAlfa(cotaPF: number, P5: number): number {
    return Math.atan((cotaPF - P5) / 4);
  }

  /**
   * NCC = -tan(alfa) * XCC + cotaPF
   * XCC = horizontal distance from MC to anchor CC point.
   */
  computeAdjustedNCC(alfaRad: number, XCC: number, cotaPF: number): number {
    return -Math.tan(alfaRad) * XCC + cotaPF;
  }

  /**
   * HC = cotaPF - tan(alfa) * XCC
   */
  computeAdjustedHC(alfaRad: number, XCC: number, cotaPF: number): number {
    return cotaPF - Math.tan(alfaRad) * XCC;
  }

  /**
   * Anchor offset = (elevFixation - cotaPF) * stayTangent
   * elevFixation = elevation of the stay attachment point on the mast (= PC + DH).
   */
  computeAnchorOffset(elevFixation: number, cotaPF: number, stayTangent: number): number {
    return (elevFixation - cotaPF) * stayTangent;
  }

  computeRealAnchorDistance(distProj: number, anchorOffset: number): number {
    return distProj + anchorOffset;
  }

  /**
   * Comp_Cabo = sqrt((elevFixation - cotaPF)^2 + G^2) - 0.8
   * G         = horizontal radial distance (realDistance)
   * 0.8 m     = rod embedment depth subtracted from cable free span
   *
   * Throws V-031 if the result is <= 0.
   */
  computeCableLength(elevFixation: number, cotaPF: number, G: number): number {
    const vertical = elevFixation - cotaPF;
    const length = Math.hypot(vertical, G) - 0.8;
    if (length <= 0) {
      throw new Error('V-031: computed cable cut length is ≤ 0');
    }
    return length;
  }

  /**
   * Runs the full terrain correction pipeline in the correct sequence:
   * Tab. Alt. Torres seed → alfa → NCC/HC → offset → realDistance → cableLength
   */
  computeTerrainPipeline(input: TerrainPipelineInput): TerrainPipelineResult {
    const { cotaPF, P5, XCC, elevFixation, distProj, stayTangent } = input;

    if (cotaPF <= 0) {
      throw new Error('V-030: cotaPF must be > 0');
    }

    const alfa = this.computeAlfa(cotaPF, P5);
    const adjustedNCC = this.computeAdjustedNCC(alfa, XCC, cotaPF);
    const adjustedHC = this.computeAdjustedHC(alfa, XCC, cotaPF);
    const anchorOffset = this.computeAnchorOffset(elevFixation, cotaPF, stayTangent);
    const realDistance = this.computeRealAnchorDistance(distProj, anchorOffset);
    const cableCutLength = this.computeCableLength(elevFixation, cotaPF, realDistance);

    return { alfa, adjustedNCC, adjustedHC, anchorOffset, realDistance, cableCutLength };
  }
}
