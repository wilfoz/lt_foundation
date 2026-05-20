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

export class TowerElement {
  foundation?: Foundation;
  surveyPoint?: SurveyPoint;
  stub?: Stub;
  stay?: StayGeometry;
  theoreticalData?: StayFieldMeasurement;
  fieldData?: StayFieldMeasurement;
  dataSource: DataSource = 'THEORETICAL';

  constructor(public readonly id: ElementId) {}

  isReady(): boolean {
    return !!this.foundation && !!this.surveyPoint && !!this.stub;
  }
}
