import { AddTowerToWorkInput, AddTowerToWorkOutput } from '../use-cases/add-tower-to-work.use-case';

export interface WorkTowerWithTower {
  workTowerId: string;
  towerId: string;
  sequence: number;
  alias?: string;
  status: string;
  tower: {
    id: string;
    type: string;
    extension: number;
    hu: number;
    classification: string;
  };
}

export interface WorkTowerRepositoryPort {
  createWithTower(input: AddTowerToWorkInput): Promise<AddTowerToWorkOutput>;
  findByWork(workId: string): Promise<WorkTowerWithTower[]>;
  findByWorkAndSequence(workId: string, sequence: number): Promise<{ id: string } | null>;
}

export const WORK_TOWER_REPOSITORY = Symbol('WORK_TOWER_REPOSITORY');
