import { Injectable } from '@nestjs/common';
import { FoundationCatalogRepository } from '../ports/foundation-catalog.repository';
import { FoundationKind } from '../../domain/entities/foundation.entity';

@Injectable()
export class ListFoundationCatalogUseCase {
  constructor(private readonly catalogRepository: FoundationCatalogRepository) {}

  async execute(kind?: FoundationKind) {
    if (kind) return this.catalogRepository.findByKind(kind);
    return this.catalogRepository.findAll();
  }
}
