import { WorkEntity, WorkStatus } from '../../domain/entities/work.entity';

export interface CreateWorkInput {
  name: string;
  contractNumber: string;
  description?: string;
  createdById: string;
}

export interface WorkListFilters {
  status?: WorkStatus;
  page?: number;
  pageSize?: number;
}

export interface WorkRepositoryPort {
  create(input: CreateWorkInput): Promise<WorkEntity>;
  findById(id: string): Promise<WorkEntity | null>;
  findAll(filters?: WorkListFilters): Promise<{ items: WorkEntity[]; total: number }>;
  updateStatus(id: string, status: WorkStatus): Promise<WorkEntity>;
}

export const WORK_REPOSITORY = Symbol('WORK_REPOSITORY');
