import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { ProjectDocument, DocumentType, ProjectType, ExtractionStatus } from '../../domain/entities/project-document.entity';
import { ProjectDocumentRepository } from '../../application/ports/project-document.repository';

@Injectable()
export class PrismaProjectDocumentRepository implements ProjectDocumentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(doc: ProjectDocument): Promise<ProjectDocument> {
    await this.prisma.projectDocument.create({
      data: {
        id: doc.id,
        filename: doc.filename,
        documentType: doc.documentType,
        projectType: doc.projectType,
        storageKey: doc.storageKey,
        status: doc.status,
        uploadedAt: doc.uploadedAt,
      },
    });
    return doc;
  }

  async findById(id: string): Promise<ProjectDocument | null> {
    const row = await this.prisma.projectDocument.findUnique({ where: { id } });
    if (!row) return null;
    return this.toDomain(row);
  }

  async update(doc: ProjectDocument): Promise<ProjectDocument> {
    await this.prisma.projectDocument.update({
      where: { id: doc.id },
      data: { status: doc.status },
    });
    return doc;
  }

  async findAll(): Promise<ProjectDocument[]> {
    const rows = await this.prisma.projectDocument.findMany({ orderBy: { uploadedAt: 'desc' } });
    return rows.map((r) => this.toDomain(r));
  }

  private toDomain(row: {
    id: string;
    filename: string;
    documentType: string;
    projectType: string;
    storageKey: string;
    status: string;
    uploadedAt: Date;
  }): ProjectDocument {
    const doc = new ProjectDocument({
      id: row.id,
      filename: row.filename,
      documentType: row.documentType as DocumentType,
      projectType: row.projectType as ProjectType,
      storageKey: row.storageKey,
    });
    doc.status = row.status as ExtractionStatus;
    return doc;
  }
}
