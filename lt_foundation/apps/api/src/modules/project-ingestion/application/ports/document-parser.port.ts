import { DocumentType, ProjectType } from '../../domain/entities/project-document.entity';

export interface ParsedProjectData {
  towerParams: Record<string, unknown>;
  legs: Record<string, unknown>[];
  elements: Record<string, unknown>[];
  confidence: number;
  warnings: string[];
}

export abstract class DocumentParserPort {
  abstract parse(
    buffer: Buffer,
    documentType: DocumentType,
    projectType: ProjectType,
  ): Promise<ParsedProjectData>;
}
