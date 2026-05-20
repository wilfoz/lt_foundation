import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { TowerRepository } from '../ports/tower.repository';
import { FoundationCatalogRepository } from '../ports/foundation-catalog.repository';
import { CaissonFoundation, FootingFoundation } from '../../domain/entities/foundation.entity';
import { ElementId } from '../../domain/entities/tower-element.entity';

export interface SelectFoundationForElementInput {
  towerId: string;
  elementId: ElementId;
  foundationKind: 'CAISSON' | 'FOOTING';
  catalogRefId: string;
  azimuth?: number;
}

@Injectable()
export class SelectFoundationForElementUseCase {
  constructor(
    private readonly towerRepository: TowerRepository,
    private readonly catalogRepository: FoundationCatalogRepository,
  ) {}

  async execute(input: SelectFoundationForElementInput): Promise<void> {
    const tower = await this.towerRepository.findById(input.towerId);
    if (!tower) throw new NotFoundException(`Tower ${input.towerId} not found`);

    const element = tower.getElement(input.elementId);
    if (!element) throw new BadRequestException(`Element ${input.elementId} not found`);

    const catalogItem = await this.catalogRepository.findById(input.catalogRefId);
    if (!catalogItem) throw new NotFoundException(`CATALOG_REF_NOT_FOUND: ${input.catalogRefId}`);

    if (input.foundationKind === 'CAISSON') {
      element.foundation = new CaissonFoundation(catalogItem.geometry as any, input.catalogRefId);
    } else {
      element.foundation = new FootingFoundation(catalogItem.geometry as any, input.azimuth ?? 0, input.catalogRefId);
    }

    await this.towerRepository.update(tower);
  }
}
