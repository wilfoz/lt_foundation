import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { ProjectDocument, DocumentType, ProjectType } from '../../domain/entities/project-document.entity';
import { DocumentStoragePort } from '../ports/document-storage.port';
import { ProjectDocumentRepository } from '../ports/project-document.repository';

export interface UploadProjectDocumentInput {
  filename: string;
  buffer: Buffer;
  documentType: DocumentType;
  projectType: ProjectType;
}

@Injectable()
export class UploadProjectDocumentUseCase {
  constructor(
    private readonly storage: DocumentStoragePort,
    private readonly docRepository: ProjectDocumentRepository,
  ) {}

  async execute(input: UploadProjectDocumentInput): Promise<ProjectDocument> {
    const storageKey = await this.storage.store(input.filename, input.buffer);
    const doc = new ProjectDocument({
      id: uuidv4(),
      filename: input.filename,
      documentType: input.documentType,
      projectType: input.projectType,
      storageKey,
    });
    return this.docRepository.save(doc);
  }
}
