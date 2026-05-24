import { Foundation, Stub } from './foundation.entity';
import { SurveyPoint } from './survey-point.entity';
import { DataSource } from './tower.entity';
import { FieldMeasurement } from './leg.entity';

export type ElementId = 'MC' | 'A' | 'B' | 'C' | 'D';

export interface StayGeometry {
  horizontalAngleDeg: number;
  inclinationAngleDeg: number;
}

export interface StayFieldMeasurement extends FieldMeasurement {
  stayHorizontalAngleDeg?: number;
  stayInclinationAngleDeg?: number;
}

/** Terrain-corrected anchor point data (pipeline: Fundacao SM-VPM). */
export interface AnchorPoint {
  cotaPF: number;
  /** Cota de referência a 5 m do PF (campo medido). */
  P5?: number;
  /** Distância horizontal do MC ao ponto CC (m). */
  XCC?: number;
  /** Inclinação do terreno (rad): arctan((cotaPF - P5) / 4). */
  alfa?: number;
  /** NCC ajustado: -tan(alfa)*XCC + cotaPF. */
  adjustedNCC?: number;
  /** HC ajustado: cotaPF - tan(alfa)*XCC. */
  adjustedHC?: number;
  /** Distância de projeto teórica (Tab. Alt. Torres via HLOOKUP). */
  distProj?: number;
  /** Afastamento: (elevFixation - cotaPF) * stayTangent. */
  anchorOffset?: number;
  /** Distância PF real = distProj + anchorOffset. */
  realDistance?: number;
  /** Comp. cabo = hypot(elevFixation - cotaPF, realDistance) - 0.8 m. */
  cableCutLength?: number;
  /** true = valores corrigidos por terreno; false = ainda teórico. */
  terrainAdjusted: boolean;
}

export class TowerElement {
  foundation?: Foundation;
  surveyPoint?: SurveyPoint;
  stub?: Stub;
  stay?: StayGeometry;
  anchorPoint?: AnchorPoint;
  theoreticalData?: StayFieldMeasurement;
  fieldData?: StayFieldMeasurement;
  dataSource: DataSource = 'THEORETICAL';

  constructor(public readonly id: ElementId) {}

  isReady(): boolean {
    return !!this.foundation && !!this.surveyPoint && !!this.stub;
  }
}
