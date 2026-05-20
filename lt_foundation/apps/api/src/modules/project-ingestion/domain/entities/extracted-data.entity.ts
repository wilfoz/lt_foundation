import { TowerClassification } from '../../../foundation-design/domain/entities/tower.entity';
import { LegId } from '../../../foundation-design/domain/entities/leg.entity';
import { ElementId } from '../../../foundation-design/domain/entities/tower-element.entity';

export interface ExtractedAngle {
  deg: number;
  min: number;
  sec: number;
  dir?: 'D' | 'E';
}

export interface ExtractedTowerParams {
  type?: string;
  extension?: number;
  Hu?: number;
  classification?: TowerClassification;
  deflectionAngle?: ExtractedAngle;
}

export interface ExtractedLegParams {
  legId: LegId;
  naturalElevation?: number;
  concreteCastingElevation?: number;
  distance?: number;
  stubType?: string;
  stubLength?: number;
  stubEmbedment?: number;
  stubInclination?: number;
  foundationCatalogRefId?: string;
  foundationAzimuth?: number;
}

export interface ExtractedElementParams {
  elementId: ElementId;
  naturalElevation?: number;
  concreteCastingElevation?: number;
  distance?: number;
  stayHorizontalAngleDeg?: number;
  stayInclinationAngleDeg?: number;
  foundationCatalogRefId?: string;
}

export class ExtractedData {
  readonly id: string;
  readonly projectDocumentId: string;
  towerParams: ExtractedTowerParams = {};
  legs: ExtractedLegParams[] = [];
  elements: ExtractedElementParams[] = [];
  userEdits: Record<string, unknown> = {};
  validatedAt?: Date;
  validatedByUserId?: string;

  constructor(params: { id: string; projectDocumentId: string }) {
    this.id = params.id;
    this.projectDocumentId = params.projectDocumentId;
  }

  applyUserEdit(path: string, value: unknown): void {
    this.userEdits[path] = value;
  }

  markValidated(userId: string): void {
    this.validatedAt = new Date();
    this.validatedByUserId = userId;
  }

  isValidated(): boolean {
    return !!this.validatedAt;
  }

  mergedTowerParams(): ExtractedTowerParams {
    return { ...this.towerParams, ...(this.userEdits['towerParams'] as object ?? {}) };
  }
}
