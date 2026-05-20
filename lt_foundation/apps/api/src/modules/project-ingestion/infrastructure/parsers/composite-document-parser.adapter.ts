import { Injectable } from '@nestjs/common';
import { DocumentType, ProjectType } from '../../domain/entities/project-document.entity';
import { DocumentParserPort, ParsedProjectData } from '../../application/ports/document-parser.port';
import { XlsParserAdapter } from './xls-parser.adapter';
import { PdfParserAdapter } from './pdf-parser.adapter';

@Injectable()
export class CompositeDocumentParserAdapter implements DocumentParserPort {
  constructor(
    private readonly xls: XlsParserAdapter,
    private readonly pdf: PdfParserAdapter,
  ) {}

  async parse(buffer: Buffer, documentType: DocumentType, projectType: ProjectType): Promise<ParsedProjectData> {
    switch (documentType) {
      case 'XLS':
        return this.xls.parse(buffer, documentType, projectType);
      case 'PDF':
        return this.pdf.parse(buffer, documentType, projectType);
      case 'DWG':
        return {
          towerParams: {},
          legs: [],
          elements: [],
          confidence: 0,
          warnings: ['DWG parsing not yet implemented — please fill all fields manually in the validation step'],
        };
    }
  }
}
