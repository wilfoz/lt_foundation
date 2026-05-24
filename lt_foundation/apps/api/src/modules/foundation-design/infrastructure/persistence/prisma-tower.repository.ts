import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/prisma.service';
import { TowerRepository } from '../../application/ports/tower.repository';
import { Tower } from '../../domain/entities/tower.entity';
import { Leg } from '../../domain/entities/leg.entity';
import { TowerElement, AnchorPoint } from '../../domain/entities/tower-element.entity';
import { CaissonFoundation, FootingFoundation } from '../../domain/entities/foundation.entity';
import { SurveyPoint } from '../../domain/entities/survey-point.entity';
import { Angle } from '../../domain/value-objects/angle.vo';

/** Returns undefined when value is null/undefined; otherwise coerces to Number. */
function toNum(v: unknown): number | undefined {
  return v == null ? undefined : Number(v);
}

@Injectable()
export class PrismaTowerRepository implements TowerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Tower | null> {
    const record = await this.prisma.tower.findUnique({
      where: { id },
      include: { legs: true, guyedElements: true },
    });
    return record ? this.toDomain(record) : null;
  }

  async save(tower: Tower): Promise<Tower> {
    await this.prisma.tower.create({
      data: {
        id: tower.id,
        type: tower.type,
        extension: tower.extension,
        hu: tower.Hu,
        classification: tower.classification,
        deflectionDeg: tower.deflectionAngle?.deg,
        deflectionMin: tower.deflectionAngle?.min,
        deflectionSec: tower.deflectionAngle?.sec,
        deflectionDir: tower.deflectionAngle?.dir,
        legs: tower.isSelfSupporting()
          ? { create: tower.legs.map((l) => ({ legId: l.id })) }
          : undefined,
        guyedElements: tower.isGuyed()
          ? { create: tower.guyedElements.map((e) => ({ elementId: e.id })) }
          : undefined,
      },
    });
    return tower;
  }

  async update(tower: Tower): Promise<Tower> {
    await this.prisma.tower.update({
      where: { id: tower.id },
      data: {
        type: tower.type,
        extension: tower.extension,
        hu: tower.Hu,
        deflectionDeg: tower.deflectionAngle?.deg,
        deflectionMin: tower.deflectionAngle?.min,
        deflectionSec: tower.deflectionAngle?.sec,
        deflectionDir: tower.deflectionAngle?.dir,
      },
    });

    for (const leg of tower.legs) {
      await this.prisma.leg.updateMany({
        where: { towerId: tower.id, legId: leg.id },
        data: {
          foundationKind: leg.foundation?.kind,
          foundationCatalogRefId: leg.foundation?.catalogRefId,
          foundationGeometry: leg.foundation ? (leg.foundation as any).geometry : undefined,
          foundationAzimuth: leg.foundation instanceof FootingFoundation ? leg.foundation.azimuth : undefined,
          naturalElevation: leg.surveyPoint?.naturalElevation,
          concreteCastingElev: leg.surveyPoint?.concreteCastingElevation,
          distance: leg.surveyPoint?.distance,
          stubType: leg.stub?.type,
          stubLength: leg.stub?.length,
          stubEmbedment: leg.stub?.embedment,
          stubInclination: leg.stub?.inclination,
        },
      });
    }

    for (const el of tower.guyedElements) {
      await this.prisma.guyedElement.updateMany({
        where: { towerId: tower.id, elementId: el.id },
        data: {
          foundationKind: el.foundation?.kind,
          foundationCatalogRefId: el.foundation?.catalogRefId,
          foundationGeometry: el.foundation ? (el.foundation as any).geometry : undefined,
          foundationAzimuth: el.foundation instanceof FootingFoundation ? el.foundation.azimuth : undefined,
          naturalElevation: el.surveyPoint?.naturalElevation,
          concreteCastingElev: el.surveyPoint?.concreteCastingElevation,
          distance: el.surveyPoint?.distance,
          stayHorizAngleDeg: el.stay ? Math.floor(el.stay.horizontalAngleDeg) : undefined,
          stayInclinationAngle: el.stay?.inclinationAngleDeg,
          stubType: el.stub?.type,
          stubLength: el.stub?.length,
          stubEmbedment: el.stub?.embedment,
          ...this.anchorPointToRecord(el.anchorPoint),
        },
      });
    }

    return tower;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.tower.delete({ where: { id } });
  }

  async findAll(): Promise<Tower[]> {
    const records = await this.prisma.tower.findMany({
      include: { legs: true, guyedElements: true },
    });
    return records.map((r) => this.toDomain(r));
  }

  // ── Private mapping helpers ──────────────────────────────────────────────────

  private toDomain(record: any): Tower {
    const deflectionAngle =
      record.deflectionDeg != null
        ? new Angle(record.deflectionDeg, record.deflectionMin ?? 0, Number(record.deflectionSec ?? 0), record.deflectionDir)
        : undefined;

    const tower = new Tower({
      id: record.id,
      type: record.type,
      extension: Number(record.extension),
      Hu: Number(record.hu),
      classification: record.classification,
      deflectionAngle,
    });

    if (record.classification === 'SELF_SUPPORTING') {
      tower.legs = record.legs.map((l: any) => this.mapLeg(l));
    } else {
      tower.guyedElements = record.guyedElements.map((e: any) => this.mapGuyedElement(e));
    }

    return tower;
  }

  private mapLeg(l: any): Leg {
    const leg = new Leg(l.legId);
    if (l.foundationKind && l.foundationGeometry) {
      leg.foundation = l.foundationKind === 'CAISSON'
        ? new CaissonFoundation(l.foundationGeometry, l.foundationCatalogRefId)
        : new FootingFoundation(l.foundationGeometry, Number(l.foundationAzimuth ?? 0), l.foundationCatalogRefId);
    }
    if (l.naturalElevation != null) {
      leg.surveyPoint = new SurveyPoint(Number(l.naturalElevation), Number(l.concreteCastingElev), Number(l.distance ?? 0));
    }
    if (l.stubType) {
      leg.stub = { type: l.stubType, length: Number(l.stubLength), embedment: Number(l.stubEmbedment), inclination: toNum(l.stubInclination) };
    }
    return leg;
  }

  private mapGuyedElement(e: any): TowerElement {
    const el = new TowerElement(e.elementId);
    if (e.foundationKind && e.foundationGeometry) {
      el.foundation = e.foundationKind === 'CAISSON'
        ? new CaissonFoundation(e.foundationGeometry, e.foundationCatalogRefId)
        : new FootingFoundation(e.foundationGeometry, Number(e.foundationAzimuth ?? 0), e.foundationCatalogRefId);
    }
    if (e.naturalElevation != null) {
      el.surveyPoint = new SurveyPoint(Number(e.naturalElevation), Number(e.concreteCastingElev), Number(e.distance ?? 0));
    }
    if (e.stayHorizAngleDeg != null) {
      el.stay = { horizontalAngleDeg: Number(e.stayHorizAngleDeg), inclinationAngleDeg: Number(e.stayInclinationAngle) };
    }
    if (e.stubType) {
      el.stub = { type: e.stubType, length: Number(e.stubLength), embedment: Number(e.stubEmbedment) };
    }
    if (e.cotaPF != null) {
      el.anchorPoint = this.mapAnchorPoint(e);
    }
    return el;
  }

  private mapAnchorPoint(e: any): AnchorPoint {
    return {
      cotaPF: Number(e.cotaPF),
      P5: toNum(e.referencePoint5m),
      XCC: toNum(e.distanceToCC),
      alfa: toNum(e.alfa),
      adjustedNCC: toNum(e.adjustedNCC),
      adjustedHC: toNum(e.adjustedHC),
      realDistance: toNum(e.anchorRealDistance),
      cableCutLength: toNum(e.cableCutLength),
      terrainAdjusted: e.terrainAdjusted ?? false,
    };
  }

  private anchorPointToRecord(ap: AnchorPoint | undefined): Record<string, unknown> {
    if (ap == null) return {};
    return {
      cotaPF: ap.cotaPF,
      referencePoint5m: ap.P5,
      distanceToCC: ap.XCC,
      alfa: ap.alfa,
      adjustedNCC: ap.adjustedNCC,
      adjustedHC: ap.adjustedHC,
      anchorRealDistance: ap.realDistance,
      cableCutLength: ap.cableCutLength,
      terrainAdjusted: ap.terrainAdjusted,
    };
  }
}
