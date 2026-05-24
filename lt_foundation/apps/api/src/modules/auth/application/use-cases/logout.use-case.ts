import { Inject, Injectable } from '@nestjs/common';
import { SessionRepositoryPort, SESSION_REPOSITORY } from '../ports/session.repository.port';

@Injectable()
export class LogoutUseCase {
  constructor(
    @Inject(SESSION_REPOSITORY) private readonly sessionRepo: SessionRepositoryPort,
  ) {}

  async execute(userId: string): Promise<void> {
    await this.sessionRepo.revokeAllByUserId(userId, new Date());
  }
}
