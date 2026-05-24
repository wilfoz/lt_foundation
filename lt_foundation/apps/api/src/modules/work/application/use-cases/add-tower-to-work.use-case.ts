import { Inject, Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { WorkRepositoryPort, WORK_REPOSITORY } from '../ports/work.repository.port';
import { WorkTowerRepositoryPort, WORK_TOWER_REPOSITORY } from '../ports/work-tower.repository.port';

export interface AddTowerToWorkInput {
  workId: string;
  type: string;
  extension: number;
  hu: number;
  classification: 'SELF_SUPPORTING' | 'GUYED';
  deflectionAngle?: { deg: number; min: number; sec: number; dir: string };
  sequence: number;
  alias?: string;
}

export interface AddTowerToWorkOutput {
  workTowerId: string;
  towerId: string;
  sequence: number;
  alias?: string;
}

@Injectable()
export class AddTowerToWorkUseCase {
  constructor(
    @Inject(WORK_REPOSITORY) private readonly workRepo: WorkRepositoryPort,
    @Inject(WORK_TOWER_REPOSITORY) private readonly workTowerRepo: WorkTowerRepositoryPort,
  ) {}

  async execute(input: AddTowerToWorkInput): Promise<AddTowerToWorkOutput> {
    const work = await this.workRepo.findById(input.workId);
    if (!work) throw new NotFoundException('Obra não encontrada.');
    if (work.isArchived()) throw new ConflictException('Obra arquivada não aceita novas torres. (V-153)');

    const existing = await this.workTowerRepo.findByWorkAndSequence(input.workId, input.sequence);
    if (existing) throw new ConflictException(`Sequência ${input.sequence} já existe nesta obra. (V-152)`);

    return this.workTowerRepo.createWithTower(input);
  }
}
