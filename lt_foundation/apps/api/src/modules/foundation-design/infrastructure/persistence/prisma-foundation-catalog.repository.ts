import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/prisma.service';
import { FoundationCatalogRepository, FoundationCatalogItem } from '../../application/ports/foundation-catalog.repository';
import { FoundationKind } from '../../domain/entities/foundation.entity';

@Injectable()
export class PrismaFoundationCatalogRepository implements FoundationCatalogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(catalogRefId: string): Promise<FoundationCatalogItem | null> {
    const record = await this.prisma.foundationCatalogItem.findUnique({ where: { catalogRefId } });
    if (!record) return null;
    return { catalogRefId: record.catalogRefId, kind: record.kind, geometry: record.geometry as any };
  }

  async findByKind(kind: FoundationKind): Promise<FoundationCatalogItem[]> {
    const records = await this.prisma.foundationCatalogItem.findMany({ where: { kind } });
    return records.map((r: any) => ({ catalogRefId: r.catalogRefId, kind: r.kind, geometry: r.geometry }));
  }

  async findAll(): Promise<FoundationCatalogItem[]> {
    const records = await this.prisma.foundationCatalogItem.findMany();
    return records.map((r: any) => ({ catalogRefId: r.catalogRefId, kind: r.kind, geometry: r.geometry }));
  }
}
