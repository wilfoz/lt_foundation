import { Foundation, Stub } from './foundation.entity';
import { SurveyPoint } from './survey-point.entity';
import { DataSource } from './tower.entity';

export type LegId = 'A' | 'B' | 'C' | 'D';

export interface FieldMeasurement {
  naturalElevation?: number;
  concreteCastingElevation?: number;
  distance?: number;
}

export class Leg {
  foundation?: Foundation;
  surveyPoint?: SurveyPoint;
  stub?: Stub;
  theoreticalData?: FieldMeasurement;
  fieldData?: FieldMeasurement;
  dataSource: DataSource = 'THEORETICAL';

  constructor(public readonly id: LegId) {}

  isReady(): boolean {
    return !!this.foundation && !!this.surveyPoint && !!this.stub;
  }
}
