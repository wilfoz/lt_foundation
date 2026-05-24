import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { WorkRepositoryPort, WORK_REPOSITORY } from '../ports/work.repository.port';
import { WorkStatus } from '../../domain/entities/work.entity';

@Injectable()
export class ArchiveWorkUseCase {
  constructor(@Inject(WORK_REPOSITORY) private readonly repo: WorkRepositoryPort) {}

  async execute(id: string): Promise<void> {
    const work = await this.repo.findById(id);
    if (!work) throw new NotFoundException('Obra não encontrada.');
    if (work.isArchived()) throw new BadRequestException('Obra já está arquivada. (V-153)');

    await this.repo.updateStatus(id, WorkStatus.ARCHIVED);
  }
}
