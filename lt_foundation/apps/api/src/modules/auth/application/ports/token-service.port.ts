import { UserRole } from '../../domain/entities/user.entity';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface TokenServicePort {
  generateTokenPair(payload: JwtPayload): Promise<TokenPair>;
  generateAccessToken(payload: JwtPayload): Promise<string>;
  verifyRefreshToken(token: string): Promise<JwtPayload>;
}

export const TOKEN_SERVICE = Symbol('TOKEN_SERVICE');
