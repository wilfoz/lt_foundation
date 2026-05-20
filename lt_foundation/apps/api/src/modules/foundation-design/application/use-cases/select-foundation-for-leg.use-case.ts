import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { TowerRepository } from '../ports/tower.repository';
import { FoundationCatalogRepository } from '../ports/foundation-catalog.repository';
import { CaissonFoundation, FootingFoundation } from '../../domain/entities/foundation.entity';
import { LegId } from '../../domain/entities/leg.entity';

export interface SelectFoundationForLegInput {
  towerId: string;
  legId: LegId;
  foundationKind: 'CAISSON' | 'FOOTING';
  catalogRefId: string;
  azimuth?: number;
}

@Injectable()
export class SelectFoundationForLegUseCase {
  constructor(
    private readonly towerRepository: TowerRepository,
    private readonly catalogRepository: FoundationCatalogRepository,
  ) {}

  async execute(input: SelectFoundationForLegInput): Promise<void> {
    const tower = await this.towerRepository.findById(input.towerId);
    if (!tower) throw new NotFoundException(`Tower ${input.towerId} not found`);

    const leg = tower.getLeg(input.legId);
    if (!leg) throw new BadRequestException(`Leg ${input.legId} not found in tower`);

    const catalogItem = await this.catalogRepository.findById(input.catalogRefId);
    if (!catalogItem) throw new NotFoundException(`CATALOG_REF_NOT_FOUND: ${input.catalogRefId}`);

    if (input.foundationKind === 'CAISSON') {
      leg.foundation = new CaissonFoundation(catalogItem.geometry as any, input.catalogRefId);
    } else {
      leg.foundation = new FootingFoundation(catalogItem.geometry as any, input.azimuth ?? 0, input.catalogRefId);
    }

    await this.towerRepository.update(tower);
  }
}
