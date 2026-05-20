import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { ExtractedData, ExtractedTowerParams, ExtractedLegParams, ExtractedElementParams } from '../../domain/entities/extracted-data.entity';
import { ExtractedDataRepository } from '../../application/ports/extracted-data.repository';

@Injectable()
export class PrismaExtractedDataRepository implements ExtractedDataRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(data: ExtractedData): Promise<ExtractedData> {
    await this.prisma.extractedData.create({
      data: {
        id: data.id,
        projectDocumentId: data.projectDocumentId,
        towerParams: data.towerParams as object,
        legs: data.legs as object[],
        elements: data.elements as object[],
        userEdits: data.userEdits as object,
        validatedAt: data.validatedAt,
        validatedByUserId: data.validatedByUserId,
      },
    });
    return data;
  }

  async findById(id: string): Promise<ExtractedData | null> {
    const row = await this.prisma.extractedData.findUnique({ where: { id } });
    if (!row) return null;
    return this.toDomain(row);
  }

  async findByDocumentId(documentId: string): Promise<ExtractedData | null> {
    const row = await this.prisma.extractedData.findFirst({
      where: { projectDocumentId: documentId },
      orderBy: { createdAt: 'desc' },
    });
    if (!row) return null;
    return this.toDomain(row);
  }

  async update(data: ExtractedData): Promise<ExtractedData> {
    await this.prisma.extractedData.update({
      where: { id: data.id },
      data: {
        towerParams: data.towerParams as object,
        legs: data.legs as object[],
        elements: data.elements as object[],
        userEdits: data.userEdits as object,
        validatedAt: data.validatedAt,
        validatedByUserId: data.validatedByUserId,
      },
    });
    return data;
  }

  private toDomain(row: {
    id: string;
    projectDocumentId: string;
    towerParams: unknown;
    legs: unknown;
    elements: unknown;
    userEdits: unknown;
    validatedAt: Date | null;
    validatedByUserId: string | null;
  }): ExtractedData {
    const data = new ExtractedData({ id: row.id, projectDocumentId: row.projectDocumentId });
    data.towerParams = (row.towerParams ?? {}) as ExtractedTowerParams;
    data.legs = (row.legs ?? []) as ExtractedLegParams[];
    data.elements = (row.elements ?? []) as ExtractedElementParams[];
    data.userEdits = (row.userEdits ?? {}) as Record<string, unknown>;
    if (row.validatedAt) {
      data.markValidated(row.validatedByUserId ?? 'unknown');
    }
    return data;
  }
}
