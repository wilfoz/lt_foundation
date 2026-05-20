import { Injectable } from '@nestjs/common';
import { DocumentType, ProjectType } from '../../domain/entities/project-document.entity';
import { DocumentParserPort, ParsedProjectData } from '../../application/ports/document-parser.port';

/**
 * Stub — PDF parsing requires integration with a PDF extraction library (e.g. pdf-parse, pdfjs-dist).
 * Returns empty data with a warning so the flow proceeds and the user can fill data manually.
 */
@Injectable()
export class PdfParserAdapter implements DocumentParserPort {
  async parse(
    _buffer: Buffer,
    documentType: DocumentType,
    _projectType: ProjectType,
  ): Promise<ParsedProjectData> {
    if (documentType !== 'PDF') {
      throw new Error(`PdfParserAdapter does not handle ${documentType}`);
    }

    return {
      towerParams: {},
      legs: [],
      elements: [],
      confidence: 0,
      warnings: ['PDF parsing not yet implemented — please fill all fields manually in the validation step'],
    };
  }
}
