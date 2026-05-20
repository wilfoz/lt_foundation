import { ProjectDocument } from '../../domain/entities/project-document.entity';

export abstract class ProjectDocumentRepository {
  abstract save(doc: ProjectDocument): Promise<ProjectDocument>;
  abstract findById(id: string): Promise<ProjectDocument | null>;
  abstract update(doc: ProjectDocument): Promise<ProjectDocument>;
  abstract findAll(): Promise<ProjectDocument[]>;
}
