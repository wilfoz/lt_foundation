import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma.service';
import { SessionEntity, SessionRepositoryPort } from '../application/ports/session.repository.port';

@Injectable()
export class PrismaSessionRepository implements SessionRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, refreshTokenHash: string, expiresAt: Date): Promise<SessionEntity> {
    return this.prisma.session.create({ data: { userId, refreshTokenHash, expiresAt } });
  }

  async findActiveByUserId(userId: string): Promise<SessionEntity | null> {
    return this.prisma.session.findFirst({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByRefreshTokenHash(hash: string): Promise<SessionEntity | null> {
    return this.prisma.session.findFirst({ where: { refreshTokenHash: hash } });
  }

  async revoke(sessionId: string, at: Date): Promise<void> {
    await this.prisma.session.update({ where: { id: sessionId }, data: { revokedAt: at } });
  }

  async revokeAllByUserId(userId: string, at: Date): Promise<void> {
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: at },
    });
  }
}
