import { Body, Controller, Get, Param, Post, Put, UseGuards, BadRequestException, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { JwtAuthGuard } from '../../auth/presentation/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/presentation/decorators/current-user.decorator';
import { JwtPayload } from '../../auth/application/ports/token-service.port';
import { PrismaReviewRepository } from '../infrastructure/prisma-review.repository';

class OverrideFieldDto {
  value: unknown;
  @IsOptional() @IsString() justification?: string;
}

class RejectDto {
  @IsString() @IsNotEmpty() reason!: string;
}

@ApiTags('Validação')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class ValidationController {
  constructor(private readonly repo: PrismaReviewRepository) {}

  @Get('api/v1/obras/:workId/validacao')
  @ApiOperation({ summary: 'Fila de revisão de uma obra' })
  queue(@Param('workId') workId: string) {
    return this.repo.findQueueByWork(workId);
  }

  @Get('api/v1/obras/:workId/validacao/count')
  @ApiOperation({ summary: 'Contador de itens pendentes' })
  async count(@Param('workId') workId: string) {
    return { pending: await this.repo.countPending(workId) };
  }

  @Get('api/v1/review-items/:id')
  @ApiOperation({ summary: 'Detalhe de um ReviewItem' })
  async findOne(@Param('id') id: string) {
    const item = await this.repo.findById(id);
    if (!item) throw new NotFoundException('ReviewItem não encontrado.');
    await this.repo.setInReview(id);
    return item;
  }

  @Put('api/v1/review-items/:id/fields/:key/override')
  @ApiOperation({ summary: 'Sobrescrever valor de um campo' })
  override(
    @Param('id') id: string,
    @Param('key') key: string,
    @Body() dto: OverrideFieldDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.repo.overrideField(id, key, dto.value, dto.justification, user.sub);
  }

  @Put('api/v1/review-items/:id/fields/:key/inspect')
  @ApiOperation({ summary: 'Marcar campo como inspecionado (sem alterar valor)' })
  inspect(
    @Param('id') id: string,
    @Param('key') key: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.repo.inspectField(id, key, user.sub);
  }

  @Post('api/v1/review-items/:id/approve')
  @ApiOperation({ summary: 'Aprovar ReviewItem (RN-301)' })
  async approve(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    try {
      return await this.repo.approve(id, user.sub);
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
  }

  @Post('api/v1/review-items/:id/reject')
  @ApiOperation({ summary: 'Rejeitar ReviewItem com motivo obrigatório' })
  async reject(@Param('id') id: string, @Body() dto: RejectDto, @CurrentUser() user: JwtPayload) {
    if (!dto.reason?.trim()) throw new BadRequestException('Motivo de rejeição é obrigatório. (V-303)');
    return this.repo.reject(id, user.sub, dto.reason);
  }
}
