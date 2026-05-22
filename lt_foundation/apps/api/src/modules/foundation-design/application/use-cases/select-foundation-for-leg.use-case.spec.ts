import { NotFoundException, BadRequestException } from '@nestjs/common';
import { SelectFoundationForLegUseCase } from './select-foundation-for-leg.use-case';
import { TowerRepository } from '../ports/tower.repository';
import { FoundationCatalogRepository } from '../ports/foundation-catalog.repository';
import { Tower } from '../../domain/entities/tower.entity';
import { Angle } from '../../domain/value-objects/angle.vo';
import { CaissonFoundation, FootingFoundation } from '../../domain/entities/foundation.entity';

const towerRepo: jest.Mocked<TowerRepository> = {
  findById: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findAll: jest.fn(),
};

const catalogRepo: jest.Mocked<FoundationCatalogRepository> = {
  findById: jest.fn(),
  findByKind: jest.fn(),
  findByTypeCode: jest.fn(),
  findAll: jest.fn(),
};

const makeTower = () => new Tower({ id: 't1', type: 'SL', extension: 6, Hu: 21, classification: 'SELF_SUPPORTING', deflectionAngle: new Angle(0, 0, 0) });

describe('SelectFoundationForLegUseCase', () => {
  const useCase = new SelectFoundationForLegUseCase(towerRepo, catalogRepo);

  beforeEach(() => jest.clearAllMocks());

  it('assigns a caisson foundation to a leg', async () => {
    const tower = makeTower();
    towerRepo.findById.mockResolvedValue(tower);
    catalogRepo.findById.mockResolvedValue({ catalogRefId: 'c001', kind: 'CAISSON', typeCode: 'TM', geometry: { shaftDiameter: 0.8, baseDiameter: 1.4, shaftHeight: 3, frustumHeight: 0.4, baseHeight: 0.8 } });
    towerRepo.update.mockResolvedValue(tower);

    await useCase.execute({ towerId: 't1', legId: 'A', foundationKind: 'CAISSON', catalogRefId: 'c001' });

    expect(tower.getLeg('A')!.foundation).toBeInstanceOf(CaissonFoundation);
  });

  it('assigns a footing foundation to a leg', async () => {
    const tower = makeTower();
    towerRepo.findById.mockResolvedValue(tower);
    catalogRepo.findById.mockResolvedValue({ catalogRefId: 'f001', kind: 'FOOTING', typeCode: 'S', geometry: { length: 2, width: 2, height: 0.6 } });
    towerRepo.update.mockResolvedValue(tower);

    await useCase.execute({ towerId: 't1', legId: 'B', foundationKind: 'FOOTING', catalogRefId: 'f001' });

    expect(tower.getLeg('B')!.foundation).toBeInstanceOf(FootingFoundation);
  });

  it('throws NotFoundException when tower not found', async () => {
    towerRepo.findById.mockResolvedValue(null);
    await expect(useCase.execute({ towerId: 'x', legId: 'A', foundationKind: 'CAISSON', catalogRefId: 'c001' }))
      .rejects.toThrow(NotFoundException);
  });

  it('throws NotFoundException when catalog ref not found', async () => {
    towerRepo.findById.mockResolvedValue(makeTower());
    catalogRepo.findById.mockResolvedValue(null);
    await expect(useCase.execute({ towerId: 't1', legId: 'A', foundationKind: 'CAISSON', catalogRefId: 'invalid' }))
      .rejects.toThrow(NotFoundException);
  });

  it('allows different foundation types per leg (RN-103)', async () => {
    const tower = makeTower();
    towerRepo.findById.mockResolvedValue(tower);
    towerRepo.update.mockResolvedValue(tower);

    catalogRepo.findById.mockResolvedValueOnce({ catalogRefId: 'c001', kind: 'CAISSON', typeCode: 'TM', geometry: { shaftDiameter: 0.8, baseDiameter: 1.4, shaftHeight: 3, frustumHeight: 0.4, baseHeight: 0.8 } });
    await useCase.execute({ towerId: 't1', legId: 'A', foundationKind: 'CAISSON', catalogRefId: 'c001' });

    catalogRepo.findById.mockResolvedValueOnce({ catalogRefId: 'f001', kind: 'FOOTING', typeCode: 'S', geometry: { length: 2, width: 2, height: 0.6 } });
    await useCase.execute({ towerId: 't1', legId: 'B', foundationKind: 'FOOTING', catalogRefId: 'f001' });

    expect(tower.getLeg('A')!.foundation).toBeInstanceOf(CaissonFoundation);
    expect(tower.getLeg('B')!.foundation).toBeInstanceOf(FootingFoundation);
  });
});
