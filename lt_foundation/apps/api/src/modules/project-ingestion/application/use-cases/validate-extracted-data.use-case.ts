import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ExtractedData } from '../../domain/entities/extracted-data.entity';
import { ExtractedDataRepository } from '../ports/extracted-data.repository';
import { ProjectDocumentRepository } from '../ports/project-document.repository';

export interface ValidateExtractedDataInput {
  documentId: string;
  userEdits: Record<string, unknown>;
  userId: string;
}

@Injectable()
export class ValidateExtractedDataUseCase {
  constructor(
    private readonly extractedDataRepo: ExtractedDataRepository,
    private readonly docRepository: ProjectDocumentRepository,
  ) {}

  async execute(input: ValidateExtractedDataInput): Promise<ExtractedData> {
    const data = await this.extractedDataRepo.findByDocumentId(input.documentId);
    if (!data) throw new NotFoundException(`ExtractedData for document ${input.documentId} not found`);

    const doc = await this.docRepository.findById(input.documentId);
    if (!doc) throw new NotFoundException(`ProjectDocument ${input.documentId} not found`);
    if (doc.status === 'COMMITTED') throw new BadRequestException('Document already committed');

    for (const [path, value] of Object.entries(input.userEdits)) {
      data.applyUserEdit(path, value);
    }

    data.markValidated(input.userId);
    doc.markValidated();

    await this.docRepository.update(doc);
    return this.extractedDataRepo.update(data);
  }
}
