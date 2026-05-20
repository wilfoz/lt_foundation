export interface FieldMeasurements {
  naturalElevation?: number;
  concreteCastingElevation?: number;
  distance?: number;
  stayHorizontalAngleDeg?: number;
  stayInclinationAngleDeg?: number;
}

export interface RecalculatedGeometry {
  protrusion: number;
  depth: number;
  concreteBottomLevel: number;
  G?: number;
  stayRadialDistance?: number;
}

export class FieldRecalculationService {
  recalculateLeg(
    theoretical: FieldMeasurements,
    field: FieldMeasurements,
    foundationHeight: number,
  ): RecalculatedGeometry {
    const Nc = field.naturalElevation ?? theoretical.naturalElevation;
    const Ncc = field.concreteCastingElevation ?? theoretical.concreteCastingElevation;
    const dist = field.distance ?? theoretical.distance ?? 0;

    if (Nc == null || Ncc == null) {
      throw new Error('V-008: naturalElevation and concreteCastingElevation are required for recalculation');
    }

    const protrusion = Nc - Ncc;
    const concreteBottomLevel = Ncc - foundationHeight;
    const G = protrusion + dist;

    return { protrusion, depth: foundationHeight, concreteBottomLevel, G };
  }

  recalculateStay(
    theoretical: FieldMeasurements,
    field: FieldMeasurements,
    Hu: number,
  ): RecalculatedGeometry {
    const inclinationDeg =
      field.stayInclinationAngleDeg ?? theoretical.stayInclinationAngleDeg;

    if (!inclinationDeg || inclinationDeg <= 0 || inclinationDeg >= 90) {
      throw new Error('V-205: inclination angle must be in (0°, 90°) for stay recalculation');
    }

    const Nc = field.naturalElevation ?? theoretical.naturalElevation;
    const Ncc = field.concreteCastingElevation ?? theoretical.concreteCastingElevation;

    if (Nc == null || Ncc == null) {
      throw new Error('V-008: naturalElevation and concreteCastingElevation are required for recalculation');
    }

    const incRad = (inclinationDeg * Math.PI) / 180;
    const stayRadialDistance = Hu / Math.tan(incRad);
    const protrusion = Nc - Ncc;

    return { protrusion, depth: 0, concreteBottomLevel: Ncc, stayRadialDistance };
  }
}
