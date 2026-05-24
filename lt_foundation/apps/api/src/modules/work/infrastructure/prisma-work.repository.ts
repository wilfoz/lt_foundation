import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma.service';
import { WorkRepositoryPort, CreateWorkInput, WorkListFilters } from '../application/ports/work.repository.port';
import { WorkEntity, WorkStatus } from '../domain/entities/work.entity';

@Injectable()
export class PrismaWorkRepository implements WorkRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateWorkInput): Promise<WorkEntity> {
    const row = await this.prisma.work.create({ data: input });
    return this.toEntity(row);
  }

  async findById(id: string): Promise<WorkEntity | null> {
    const row = await this.prisma.work.findUnique({ where: { id } });
    return row ? this.toEntity(row) : null;
  }

  async findAll(filters?: WorkListFilters): Promise<{ items: WorkEntity[]; total: number }> {
    const where = filters?.status ? { status: filters.status } : {};
    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 20;

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.work.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.work.count({ where }),
    ]);

    return { items: rows.map((r) => this.toEntity(r)), total };
  }

  async updateStatus(id: string, status: WorkStatus): Promise<WorkEntity> {
    const row = await this.prisma.work.update({ where: { id }, data: { status } });
    return this.toEntity(row);
  }

  private toEntity(row: any): WorkEntity {
    return new WorkEntity(
      row.id,
      row.name,
      row.contractNumber,
      row.status as WorkStatus,
      row.createdById,
      row.createdAt,
      row.updatedAt,
      row.description ?? undefined,
    );
  }
}
