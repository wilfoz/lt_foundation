import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma.service';
import { CreateAuditLogInput, SystemAuditLogRepositoryPort } from '../application/ports/system-audit-log.repository.port';

@Injectable()
export class PrismaSystemAuditLogRepository implements SystemAuditLogRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateAuditLogInput): Promise<void> {
    await this.prisma.systemAuditLog.create({
      data: { ...input, metadata: input.metadata as any },
    });
  }
}
