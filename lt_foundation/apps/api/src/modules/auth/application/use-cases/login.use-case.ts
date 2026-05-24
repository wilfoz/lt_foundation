import { Inject, Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { UserRepositoryPort, USER_REPOSITORY } from '../ports/user.repository.port';
import { SessionRepositoryPort, SESSION_REPOSITORY } from '../ports/session.repository.port';
import { PasswordHasherPort, PASSWORD_HASHER } from '../ports/password-hasher.port';
import { TokenServicePort, TOKEN_SERVICE } from '../ports/token-service.port';

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginOutput {
  accessToken: string;
  refreshToken: string;
  user: { id: string; name: string; email: string; role: string };
}

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepositoryPort,
    @Inject(SESSION_REPOSITORY) private readonly sessionRepo: SessionRepositoryPort,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasherPort,
    @Inject(TOKEN_SERVICE) private readonly tokenService: TokenServicePort,
  ) {}

  async execute(input: LoginInput): Promise<LoginOutput> {
    const user = await this.userRepo.findByEmail(input.email);
    if (!user) throw new UnauthorizedException('Credenciais inválidas.');

    const passwordOk = await this.hasher.compare(input.password, user.passwordHash);
    if (!passwordOk) throw new UnauthorizedException('Credenciais inválidas.');

    if (!user.isActive()) throw new ForbiddenException('Usuário inativo.');

    const { accessToken, refreshToken } = await this.tokenService.generateTokenPair({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshTokenHash = Buffer.from(refreshToken).toString('base64');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.sessionRepo.revokeAllByUserId(user.id, new Date());
    await this.sessionRepo.create(user.id, refreshTokenHash, expiresAt);
    await this.userRepo.updateLastLogin(user.id, new Date());

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    };
  }
}
