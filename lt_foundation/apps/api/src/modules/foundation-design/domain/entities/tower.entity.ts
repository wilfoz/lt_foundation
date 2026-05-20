import { Angle } from '../value-objects/angle.vo';
import { Leg, LegId } from './leg.entity';
import { TowerElement, ElementId } from './tower-element.entity';

export type TowerClassification = 'SELF_SUPPORTING' | 'GUYED';
export type DataSource = 'THEORETICAL' | 'FIELD' | 'RECALCULATED';

export class Tower {
  readonly id: string;
  type: string;
  extension: number;
  Hu: number;
  classification: TowerClassification;
  deflectionAngle?: Angle;
  legs: Leg[] = [];
  guyedElements: TowerElement[] = [];

  projectDocumentId?: string;
  dataSource: DataSource = 'THEORETICAL';
  version: number = 1;

  constructor(params: {
    id: string;
    type: string;
    extension: number;
    Hu: number;
    classification: TowerClassification;
    deflectionAngle?: Angle;
    projectDocumentId?: string;
    dataSource?: DataSource;
    version?: number;
  }) {
    this.id = params.id;
    this.type = params.type;
    this.extension = params.extension;
    this.Hu = params.Hu;
    this.classification = params.classification;
    this.deflectionAngle = params.deflectionAngle;
    this.projectDocumentId = params.projectDocumentId;
    this.dataSource = params.dataSource ?? 'THEORETICAL';
    this.version = params.version ?? 1;

    if (params.classification === 'SELF_SUPPORTING') {
      this.legs = (['A', 'B', 'C', 'D'] as LegId[]).map((id) => new Leg(id));
    } else {
      this.guyedElements = [
        new TowerElement('MC'),
        ...(['A', 'B', 'C', 'D'] as ElementId[]).map((id) => new TowerElement(id)),
      ];
    }
  }

  getLeg(id: LegId): Leg | undefined {
    return this.legs.find((l) => l.id === id);
  }

  getElement(id: ElementId): TowerElement | undefined {
    return this.guyedElements.find((e) => e.id === id);
  }

  isSelfSupporting(): boolean {
    return this.classification === 'SELF_SUPPORTING';
  }

  isGuyed(): boolean {
    return this.classification === 'GUYED';
  }

  allLegsReady(): boolean {
    return this.isSelfSupporting() && this.legs.length === 4 && this.legs.every((l) => l.isReady());
  }

  allElementsReady(): boolean {
    return this.isGuyed() && this.guyedElements.length === 5 && this.guyedElements.every((e) => e.isReady());
  }

  canCalculate(): boolean {
    return !!this.deflectionAngle && (this.allLegsReady() || this.allElementsReady());
  }
}
