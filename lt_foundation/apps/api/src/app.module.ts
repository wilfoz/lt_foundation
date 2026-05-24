import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { WorkModule } from './modules/work/work.module';
import { ValidationModule } from './modules/validation/validation.module';
import { FoundationDesignModule } from './modules/foundation-design/foundation-design.module';
import { ProjectIngestionModule } from './modules/project-ingestion/project-ingestion.module';
import { JwtAuthGuard } from './modules/auth/presentation/guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    WorkModule,
    ValidationModule,
    FoundationDesignModule,
    ProjectIngestionModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
