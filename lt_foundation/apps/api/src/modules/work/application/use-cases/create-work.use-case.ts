import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { WorkRepositoryPort, WORK_REPOSITORY } from '../ports/work.repository.port';
import { WorkEntity } from '../../domain/entities/work.entity';

export interface CreateWorkInput {
  name: string;
  contractNumber: string;
  description?: string;
  userId: string;
}

@Injectable()
export class CreateWorkUseCase {
  constructor(@Inject(WORK_REPOSITORY) private readonly repo: WorkRepositoryPort) {}

  async execute(input: CreateWorkInput): Promise<WorkEntity> {
    if (!input.name?.trim()) throw new BadRequestException('Nome da obra é obrigatório. (V-150)');
    if (!input.contractNumber?.trim()) throw new BadRequestException('Número do contrato é obrigatório. (V-151)');

    return this.repo.create({
      name: input.name.trim(),
      contractNumber: input.contractNumber.trim(),
      description: input.description?.trim(),
      createdById: input.userId,
    });
  }
}
