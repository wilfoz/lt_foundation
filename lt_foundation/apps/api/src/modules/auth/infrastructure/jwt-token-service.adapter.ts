import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload, TokenPair, TokenServicePort } from '../application/ports/token-service.port';

@Injectable()
export class JwtTokenServiceAdapter implements TokenServicePort {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async generateTokenPair(payload: JwtPayload): Promise<TokenPair> {
    const accessToken = await this.generateAccessToken(payload);
    const refreshToken = this.jwt.sign(
      { sub: payload.sub, email: payload.email, role: payload.role },
      {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '7d') as any,
      },
    );
    return { accessToken, refreshToken };
  }

  async generateAccessToken(payload: JwtPayload): Promise<string> {
    return this.jwt.signAsync(
      { sub: payload.sub, email: payload.email, role: payload.role },
      {
        secret: this.config.get<string>('JWT_SECRET'),
        expiresIn: this.config.get('JWT_EXPIRES_IN', '1h') as any,
      },
    );
  }

  async verifyRefreshToken(token: string): Promise<JwtPayload> {
    return this.jwt.verifyAsync<JwtPayload>(token, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
    });
  }
}
