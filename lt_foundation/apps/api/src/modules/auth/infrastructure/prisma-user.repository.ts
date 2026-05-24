import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma.service';
import { UserRepositoryPort } from '../application/ports/user.repository.port';
import { UserEntity, UserRole } from '../domain/entities/user.entity';

@Injectable()
export class PrismaUserRepository implements UserRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<UserEntity | null> {
    const row = await this.prisma.user.findUnique({ where: { email } });
    return row ? this.toEntity(row) : null;
  }

  async findById(id: string): Promise<UserEntity | null> {
    const row = await this.prisma.user.findUnique({ where: { id } });
    return row ? this.toEntity(row) : null;
  }

  async updateLastLogin(id: string, at: Date): Promise<void> {
    await this.prisma.user.update({ where: { id }, data: { lastLoginAt: at } });
  }

  private toEntity(row: any): UserEntity {
    return new UserEntity(
      row.id,
      row.email,
      row.name,
      row.role as UserRole,
      row.passwordHash,
      row.active,
      row.createdAt,
      row.lastLoginAt ?? undefined,
    );
  }
}
