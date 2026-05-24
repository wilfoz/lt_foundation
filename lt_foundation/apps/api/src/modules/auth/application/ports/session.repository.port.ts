export interface SessionEntity {
  id: string;
  userId: string;
  refreshTokenHash: string;
  expiresAt: Date;
  revokedAt?: Date | null;
}

export interface SessionRepositoryPort {
  create(userId: string, refreshTokenHash: string, expiresAt: Date): Promise<SessionEntity>;
  findActiveByUserId(userId: string): Promise<SessionEntity | null>;
  findByRefreshTokenHash(hash: string): Promise<SessionEntity | null>;
  revoke(sessionId: string, at: Date): Promise<void>;
  revokeAllByUserId(userId: string, at: Date): Promise<void>;
}

export const SESSION_REPOSITORY = Symbol('SESSION_REPOSITORY');
