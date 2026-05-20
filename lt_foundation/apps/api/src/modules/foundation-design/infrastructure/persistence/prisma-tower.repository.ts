import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/prisma.service';
import { TowerRepository } from '../../application/ports/tower.repository';
import { Tower } from '../../domain/entities/tower.entity';
import { Leg } from '../../domain/entities/leg.entity';
import { TowerElement } from '../../domain/entities/tower-element.entity';
import { CaissonFoundation, FootingFoundation } from '../../domain/entities/foundation.entity';
import { SurveyPoint } from '../../domain/entities/survey-point.entity';
import { Angle } from '../../domain/value-objects/angle.vo';

@Injectable()
export class PrismaTowerRepository implements TowerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Tower | null> {
    const record = await this.prisma.tower.findUnique({
      where: { id },
      include: { legs: true, guyedElements: true },
    });
    if (!record) return null;
    return this.toDomain(record);
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
      tower.legs = record.legs.map((l: any) => {
        const leg = new Leg(l.legId);
        if (l.foundationKind && l.foundationGeometry) {
          leg.foundation = l.foundationKind === 'CAISSON'
            ? new CaissonFoundation(l.foundationGeometry, l.foundationCatalogRefId)
            : new FootingFoundation(l.foundationGeometry, Number(l.foundationAzimuth ?? 0), l.foundationCatalogRefId);
        }
        if (l.naturalElevation != null) {
          leg.surveyPoint = new SurveyPoint(Number(l.naturalElevation), Number(l.concreteCastingElev), Number(l.distance ?? 0));
        }
        if (l.stubType) leg.stub = { type: l.stubType, length: Number(l.stubLength), embedment: Number(l.stubEmbedment), inclination: l.stubInclination ? Number(l.stubInclination) : undefined };
        return leg;
      });
    } else {
      tower.guyedElements = record.guyedElements.map((e: any) => {
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
        if (e.stubType) el.stub = { type: e.stubType, length: Number(e.stubLength), embedment: Number(e.stubEmbedment) };
        return el;
      });
    }

    return tower;
  }
}
