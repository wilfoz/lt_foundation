import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma.service';
import { WorkTowerRepositoryPort, WorkTowerWithTower } from '../application/ports/work-tower.repository.port';
import { AddTowerToWorkInput, AddTowerToWorkOutput } from '../application/use-cases/add-tower-to-work.use-case';

@Injectable()
export class PrismaWorkTowerRepository implements WorkTowerRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async createWithTower(input: AddTowerToWorkInput): Promise<AddTowerToWorkOutput> {
    return this.prisma.$transaction(async (tx) => {
      const legsData =
        input.classification === 'SELF_SUPPORTING'
          ? ['A', 'B', 'C', 'D'].map((id) => ({ legId: id }))
          : undefined;

      const elementsData =
        input.classification === 'GUYED'
          ? ['MC', 'A', 'B', 'C', 'D'].map((id) => ({ elementId: id }))
          : undefined;

      const tower = await tx.tower.create({
        data: {
          type: input.type,
          extension: input.extension,
          hu: input.hu,
          classification: input.classification,
          deflectionDeg: input.deflectionAngle?.deg,
          deflectionMin: input.deflectionAngle?.min,
          deflectionSec: input.deflectionAngle?.sec,
          deflectionDir: input.deflectionAngle?.dir,
          legs: legsData ? { create: legsData } : undefined,
          guyedElements: elementsData ? { create: elementsData } : undefined,
        },
      });

      const wt = await tx.workTower.create({
        data: {
          workId: input.workId,
          towerId: tower.id,
          sequence: input.sequence,
          alias: input.alias,
        },
      });

      return { workTowerId: wt.id, towerId: tower.id, sequence: wt.sequence, alias: wt.alias ?? undefined };
    });
  }

  async findByWork(workId: string): Promise<WorkTowerWithTower[]> {
    const rows = await this.prisma.workTower.findMany({
      where: { workId },
      orderBy: { sequence: 'asc' },
      include: { tower: true },
    });

    return rows.map((r) => ({
      workTowerId: r.id,
      towerId: r.towerId,
      sequence: r.sequence,
      alias: r.alias ?? undefined,
      status: r.status,
      tower: {
        id: r.tower.id,
        type: r.tower.type,
        extension: Number(r.tower.extension),
        hu: Number(r.tower.hu),
        classification: r.tower.classification,
      },
    }));
  }

  async findByWorkAndSequence(workId: string, sequence: number): Promise<{ id: string } | null> {
    return this.prisma.workTower.findFirst({ where: { workId, sequence }, select: { id: true } });
  }
}
