import { CreateTowerUseCase } from './create-tower.use-case';
import { TowerRepository } from '../ports/tower.repository';
import { Tower } from '../../domain/entities/tower.entity';

const mockRepo: jest.Mocked<TowerRepository> = {
  findById: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findAll: jest.fn(),
};

describe('CreateTowerUseCase', () => {
  const useCase = new CreateTowerUseCase(mockRepo);

  beforeEach(() => jest.clearAllMocks());

  it('creates a self-supporting tower with 4 legs', async () => {
    mockRepo.save.mockImplementation(async (t) => t);

    const tower = await useCase.execute({
      type: 'SL',
      extension: 6,
      Hu: 21,
      classification: 'SELF_SUPPORTING',
      deflectionAngle: { deg: 60, min: 19, sec: 54, dir: 'D' },
    });

    expect(tower.classification).toBe('SELF_SUPPORTING');
    expect(tower.legs).toHaveLength(4);
    expect(tower.legs.map((l) => l.id)).toEqual(['A', 'B', 'C', 'D']);
  });

  it('creates a guyed tower with MC + 4 stays', async () => {
    mockRepo.save.mockImplementation(async (t) => t);

    const tower = await useCase.execute({
      type: 'SY',
      extension: 3,
      Hu: 30,
      classification: 'GUYED',
      deflectionAngle: { deg: 0, min: 0, sec: 0 },
    });

    expect(tower.classification).toBe('GUYED');
    expect(tower.guyedElements).toHaveLength(5);
    expect(tower.guyedElements.map((e) => e.id)).toContain('MC');
  });

  it('persists the tower via repository', async () => {
    mockRepo.save.mockImplementation(async (t) => t);
    await useCase.execute({ type: 'SL', extension: 6, Hu: 21, classification: 'SELF_SUPPORTING', deflectionAngle: { deg: 0, min: 0, sec: 0 } });
    expect(mockRepo.save).toHaveBeenCalledTimes(1);
  });
});
