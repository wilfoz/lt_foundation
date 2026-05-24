import { Module } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma.service';
import { AuthModule } from '../auth/auth.module';
import { PrismaReviewRepository } from './infrastructure/prisma-review.repository';
import { ValidationController } from './presentation/validation.controller';

@Module({
  imports: [AuthModule],
  controllers: [ValidationController],
  providers: [PrismaService, PrismaReviewRepository],
  exports: [PrismaReviewRepository],
})
export class ValidationModule {}
