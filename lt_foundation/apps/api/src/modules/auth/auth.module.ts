import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../shared/prisma.service';

import { USER_REPOSITORY } from './application/ports/user.repository.port';
import { SESSION_REPOSITORY } from './application/ports/session.repository.port';
import { SYSTEM_AUDIT_LOG_REPOSITORY } from './application/ports/system-audit-log.repository.port';
import { PASSWORD_HASHER } from './application/ports/password-hasher.port';
import { TOKEN_SERVICE } from './application/ports/token-service.port';

import { PrismaUserRepository } from './infrastructure/prisma-user.repository';
import { PrismaSessionRepository } from './infrastructure/prisma-session.repository';
import { PrismaSystemAuditLogRepository } from './infrastructure/prisma-system-audit-log.repository';
import { BcryptPasswordHasherAdapter } from './infrastructure/bcrypt-password-hasher.adapter';
import { JwtTokenServiceAdapter } from './infrastructure/jwt-token-service.adapter';

import { LoginUseCase } from './application/use-cases/login.use-case';
import { RefreshTokenUseCase } from './application/use-cases/refresh-token.use-case';
import { LogoutUseCase } from './application/use-cases/logout.use-case';

import { AuthController } from './presentation/controllers/auth.controller';
import { JwtAuthGuard } from './presentation/guards/jwt-auth.guard';
import { RolesGuard } from './presentation/guards/roles.guard';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'change-me-in-production'),
        signOptions: { expiresIn: (config.get<string>('JWT_EXPIRES_IN', '1h')) as any },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    PrismaService,
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    { provide: SESSION_REPOSITORY, useClass: PrismaSessionRepository },
    { provide: SYSTEM_AUDIT_LOG_REPOSITORY, useClass: PrismaSystemAuditLogRepository },
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasherAdapter },
    { provide: TOKEN_SERVICE, useClass: JwtTokenServiceAdapter },
    LoginUseCase,
    RefreshTokenUseCase,
    LogoutUseCase,
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [JwtAuthGuard, RolesGuard, SYSTEM_AUDIT_LOG_REPOSITORY, JwtModule],
})
export class AuthModule {}
