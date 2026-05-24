import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { SessionRepositoryPort, SESSION_REPOSITORY } from '../ports/session.repository.port';
import { UserRepositoryPort, USER_REPOSITORY } from '../ports/user.repository.port';
import { TokenServicePort, TOKEN_SERVICE } from '../ports/token-service.port';

export interface RefreshTokenOutput {
  accessToken: string;
}

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    @Inject(SESSION_REPOSITORY) private readonly sessionRepo: SessionRepositoryPort,
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepositoryPort,
    @Inject(TOKEN_SERVICE) private readonly tokenService: TokenServicePort,
  ) {}

  async execute(refreshToken: string): Promise<RefreshTokenOutput> {
    const hash = Buffer.from(refreshToken).toString('base64');
    const session = await this.sessionRepo.findByRefreshTokenHash(hash);

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token inválido ou expirado.');
    }

    const user = await this.userRepo.findById(session.userId);
    if (!user || !user.isActive()) throw new UnauthorizedException('Usuário inativo.');

    const accessToken = await this.tokenService.generateAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return { accessToken };
  }
}
