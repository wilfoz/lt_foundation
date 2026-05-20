export type DocumentType = 'PDF' | 'XLS' | 'DWG';
export type ExtractionStatus = 'PENDING' | 'EXTRACTED' | 'VALIDATED' | 'COMMITTED' | 'REJECTED';

export type ProjectType =
  | 'GUYED_HEIGHT_LOCATION'
  | 'GUYED_FOUNDATION'
  | 'SELF_SUPPORTING_STUBS'
  | 'SELF_SUPPORTING_FOUNDATION';

export class ProjectDocument {
  readonly id: string;
  filename: string;
  documentType: DocumentType;
  projectType: ProjectType;
  storageKey: string;
  status: ExtractionStatus = 'PENDING';
  readonly uploadedAt: Date;

  constructor(params: {
    id: string;
    filename: string;
    documentType: DocumentType;
    projectType: ProjectType;
    storageKey: string;
  }) {
    this.id = params.id;
    this.filename = params.filename;
    this.documentType = params.documentType;
    this.projectType = params.projectType;
    this.storageKey = params.storageKey;
    this.uploadedAt = new Date();
  }

  markExtracted(): void {
    this.status = 'EXTRACTED';
  }

  markValidated(): void {
    if (this.status !== 'EXTRACTED') throw new Error('Document must be EXTRACTED before validation');
    this.status = 'VALIDATED';
  }

  markCommitted(): void {
    if (this.status !== 'VALIDATED') throw new Error('Document must be VALIDATED before commit');
    this.status = 'COMMITTED';
  }

  markRejected(): void {
    this.status = 'REJECTED';
  }
}
