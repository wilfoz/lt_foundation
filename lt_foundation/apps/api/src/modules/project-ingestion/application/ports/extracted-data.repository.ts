import { ExtractedData } from '../../domain/entities/extracted-data.entity';

export abstract class ExtractedDataRepository {
  abstract save(data: ExtractedData): Promise<ExtractedData>;
  abstract findById(id: string): Promise<ExtractedData | null>;
  abstract findByDocumentId(documentId: string): Promise<ExtractedData | null>;
  abstract update(data: ExtractedData): Promise<ExtractedData>;
}
