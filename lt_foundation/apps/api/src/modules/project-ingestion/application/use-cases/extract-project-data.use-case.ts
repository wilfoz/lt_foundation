import { Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { ExtractedData } from '../../domain/entities/extracted-data.entity';
import { DataNormalizerService } from '../../domain/services/data-normalizer.service';
import { DocumentStoragePort } from '../ports/document-storage.port';
import { DocumentParserPort } from '../ports/document-parser.port';
import { ProjectDocumentRepository } from '../ports/project-document.repository';
import { ExtractedDataRepository } from '../ports/extracted-data.repository';

@Injectable()
export class ExtractProjectDataUseCase {
  constructor(
    private readonly docRepository: ProjectDocumentRepository,
    private readonly storage: DocumentStoragePort,
    private readonly parser: DocumentParserPort,
    private readonly extractedDataRepo: ExtractedDataRepository,
    private readonly normalizer: DataNormalizerService,
  ) {}

  async execute(documentId: string): Promise<ExtractedData> {
    const doc = await this.docRepository.findById(documentId);
    if (!doc) throw new NotFoundException(`ProjectDocument ${documentId} not found`);

    const buffer = await this.storage.retrieve(doc.storageKey);
    const parsed = await this.parser.parse(buffer, doc.documentType, doc.projectType);

    const data = new ExtractedData({ id: uuidv4(), projectDocumentId: documentId });
    data.towerParams = this.normalizer.normalizeTowerParams(parsed.towerParams);
    data.legs = this.normalizer.normalizeLegParams(parsed.legs);
    data.elements = this.normalizer.normalizeElementParams(parsed.elements);

    doc.markExtracted();
    await this.docRepository.update(doc);
    return this.extractedDataRepo.save(data);
  }
}
