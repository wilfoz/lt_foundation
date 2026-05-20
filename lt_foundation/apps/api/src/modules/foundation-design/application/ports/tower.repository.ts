import { Tower } from '../../domain/entities/tower.entity';

export abstract class TowerRepository {
  abstract findById(id: string): Promise<Tower | null>;
  abstract save(tower: Tower): Promise<Tower>;
  abstract update(tower: Tower): Promise<Tower>;
  abstract delete(id: string): Promise<void>;
  abstract findAll(): Promise<Tower[]>;
}
