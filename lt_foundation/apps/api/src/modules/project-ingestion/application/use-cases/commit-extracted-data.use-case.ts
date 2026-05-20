import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Tower } from '../../../foundation-design/domain/entities/tower.entity';
import { Angle } from '../../../foundation-design/domain/value-objects/angle.vo';
import { SurveyPoint } from '../../../foundation-design/domain/entities/survey-point.entity';
import { TowerRepository } from '../../../foundation-design/application/ports/tower.repository';
import { FoundationCatalogRepository } from '../../../foundation-design/application/ports/foundation-catalog.repository';
import {
  CaissonFoundation,
  FootingFoundation,
  FOUNDATION_TYPE_KIND_MAP,
} from '../../../foundation-design/domain/entities/foundation.entity';
import { ExtractedLegParams, ExtractedElementParams } from '../../domain/entities/extracted-data.entity';
import { ExtractedDataRepository } from '../ports/extracted-data.repository';
import { ProjectDocumentRepository } from '../ports/project-document.repository';

@Injectable()
export class CommitExtractedDataUseCase {
  constructor(
    private readonly extractedDataRepo: ExtractedDataRepository,
    private readonly docRepository: ProjectDocumentRepository,
    private readonly towerRepository: TowerRepository,
    private readonly catalogRepository: FoundationCatalogRepository,
  ) {}

  async execute(documentId: string): Promise<Tower> {
    const data = await this.extractedDataRepo.findByDocumentId(documentId);
    if (!data) throw new NotFoundException(`ExtractedData for document ${documentId} not found`);
    if (!data.isValidated()) {
      throw new BadRequestException('VALIDATION_REQUIRED: human validation must be completed before commit');
    }

    const doc = await this.docRepository.findById(documentId);
    if (!doc) throw new NotFoundException(`ProjectDocument ${documentId} not found`);

    const tp = data.mergedTowerParams();

    const deflectionAngle = tp.deflectionAngle
      ? new Angle(tp.deflectionAngle.deg, tp.deflectionAngle.min, tp.deflectionAngle.sec, tp.deflectionAngle.dir)
      : undefined;

    const tower = new Tower({
      id: uuidv4(),
      type: tp.type ?? 'UNKNOWN',
      extension: tp.extension ?? 0,
      Hu: tp.Hu ?? 0,
      classification: tp.classification ?? 'SELF_SUPPORTING',
      deflectionAngle,
      projectDocumentId: documentId,
      dataSource: 'THEORETICAL',
      version: 1,
    });

    if (tower.isSelfSupporting()) {
      await this.applyLegsData(tower, data.legs);
    } else {
      await this.applyElementsData(tower, data.elements);
    }

    const saved = await this.towerRepository.save(tower);
    doc.markCommitted();
    await this.docRepository.update(doc);
    return saved;
  }

  private async applyLegsData(tower: Tower, legs: ExtractedLegParams[]): Promise<void> {
    for (const legData of legs) {
      const leg = tower.getLeg(legData.legId);
      if (!leg) continue;

      if (legData.naturalElevation != null && legData.concreteCastingElevation != null) {
        leg.surveyPoint = new SurveyPoint(
          legData.naturalElevation,
          legData.concreteCastingElevation,
          legData.distance ?? 0,
        );
      }

      if (legData.stubType) {
        leg.stub = {
          type: legData.stubType,
          length: legData.stubLength ?? 0,
          embedment: legData.stubEmbedment ?? 0,
          inclination: legData.stubInclination,
        };
      }

      if (legData.foundationCatalogRefId) {
        const item = await this.catalogRepository.findById(legData.foundationCatalogRefId);
        if (item) {
          const kind = FOUNDATION_TYPE_KIND_MAP[item.typeCode] ?? item.kind;
          if (kind === 'CAISSON') {
            leg.foundation = new CaissonFoundation(item.geometry as any, item.catalogRefId);
          } else {
            leg.foundation = new FootingFoundation(item.geometry as any, legData.foundationAzimuth ?? 0, item.catalogRefId);
          }
        }
      }

      leg.theoreticalData = {
        naturalElevation: legData.naturalElevation,
        concreteCastingElevation: legData.concreteCastingElevation,
        distance: legData.distance,
      };
    }
  }

  private async applyElementsData(tower: Tower, elements: ExtractedElementParams[]): Promise<void> {
    for (const elData of elements) {
      const el = tower.getElement(elData.elementId);
      if (!el) continue;

      if (elData.naturalElevation != null && elData.concreteCastingElevation != null) {
        el.surveyPoint = new SurveyPoint(
          elData.naturalElevation,
          elData.concreteCastingElevation,
          elData.distance ?? 0,
        );
      }

      if (elData.stayHorizontalAngleDeg != null && elData.stayInclinationAngleDeg != null) {
        el.stay = {
          horizontalAngleDeg: elData.stayHorizontalAngleDeg,
          inclinationAngleDeg: elData.stayInclinationAngleDeg,
        };
      }

      if (elData.foundationCatalogRefId) {
        const item = await this.catalogRepository.findById(elData.foundationCatalogRefId);
        if (item) {
          const kind = FOUNDATION_TYPE_KIND_MAP[item.typeCode] ?? item.kind;
          if (kind === 'CAISSON') {
            el.foundation = new CaissonFoundation(item.geometry as any, item.catalogRefId);
          } else {
            el.foundation = new FootingFoundation(item.geometry as any, 0, item.catalogRefId);
          }
        }
      }

      el.theoreticalData = {
        naturalElevation: elData.naturalElevation,
        concreteCastingElevation: elData.concreteCastingElevation,
        distance: elData.distance,
        stayHorizontalAngleDeg: elData.stayHorizontalAngleDeg,
        stayInclinationAngleDeg: elData.stayInclinationAngleDeg,
      };
    }
  }
}
