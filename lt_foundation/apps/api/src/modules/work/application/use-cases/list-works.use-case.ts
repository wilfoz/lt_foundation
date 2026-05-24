import { Inject, Injectable } from '@nestjs/common';
import { WorkRepositoryPort, WORK_REPOSITORY, WorkListFilters } from '../ports/work.repository.port';
import { WorkEntity } from '../../domain/entities/work.entity';

export interface ListWorksOutput {
  items: WorkEntity[];
  total: number;
}

@Injectable()
export class ListWorksUseCase {
  constructor(@Inject(WORK_REPOSITORY) private readonly repo: WorkRepositoryPort) {}

  async execute(filters?: WorkListFilters): Promise<ListWorksOutput> {
    return this.repo.findAll(filters);
  }
}
