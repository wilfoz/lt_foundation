import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma.service';

@Injectable()
export class PrismaReviewRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findQueueByWork(workId: string) {
    return this.prisma.reviewItem.findMany({
      where: { workId, status: { in: ['PENDING', 'IN_REVIEW'] } },
      include: {
        fields: { select: { id: true, key: true, needsReview: true, inspected: true, confidence: true, extractedValue: true, parsedValue: true, humanValue: true, overridden: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findById(id: string) {
    return this.prisma.reviewItem.findUnique({
      where: { id },
      include: {
        fields: {
          include: { auditEntries: { orderBy: { timestamp: 'asc' } } },
        },
      },
    });
  }

  async setInReview(id: string) {
    return this.prisma.reviewItem.update({ where: { id }, data: { status: 'IN_REVIEW' } });
  }

  async overrideField(reviewItemId: string, key: string, humanValue: unknown, justification: string | undefined, userId: string) {
    const field = await this.prisma.reviewField.findUniqueOrThrow({ where: { reviewItemId_key: { reviewItemId, key } } });
    await this.prisma.reviewField.update({
      where: { id: field.id },
      data: { humanValue: humanValue as any, overridden: true, inspected: true },
    });
    await this.prisma.reviewAuditEntry.create({
      data: { reviewFieldId: field.id, userId, action: 'OVERRIDE', previousValue: field.humanValue as any, newValue: humanValue as any, justification },
    });
  }

  async inspectField(reviewItemId: string, key: string, userId: string) {
    const field = await this.prisma.reviewField.findUniqueOrThrow({ where: { reviewItemId_key: { reviewItemId, key } } });
    await this.prisma.reviewField.update({ where: { id: field.id }, data: { inspected: true } });
    await this.prisma.reviewAuditEntry.create({
      data: { reviewFieldId: field.id, userId, action: 'APPROVE' },
    });
  }

  async approve(id: string, userId: string) {
    const item = await this.findById(id);
    if (!item) throw new Error('ReviewItem not found');
    const unreviewed = item.fields.filter((f) => f.needsReview && !f.inspected);
    if (unreviewed.length > 0) throw new Error(`Campos não inspecionados: ${unreviewed.map((f) => f.key).join(', ')}. (V-301)`);
    return this.prisma.reviewItem.update({
      where: { id },
      data: { status: 'APPROVED', reviewedById: userId, reviewedAt: new Date() },
    });
  }

  async reject(id: string, userId: string, reason: string) {
    return this.prisma.reviewItem.update({
      where: { id },
      data: { status: 'REJECTED', reviewedById: userId, reviewedAt: new Date(), rejectionReason: reason },
    });
  }

  async countPending(workId: string): Promise<number> {
    return this.prisma.reviewItem.count({ where: { workId, status: { in: ['PENDING', 'IN_REVIEW'] } } });
  }
}
