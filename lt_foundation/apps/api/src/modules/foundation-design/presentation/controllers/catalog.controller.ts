import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ListFoundationCatalogUseCase } from '../../application/use-cases/list-foundation-catalog.use-case';
import { FoundationKind } from '../../domain/entities/foundation.entity';

@ApiTags('catalog')
@Controller('api/v1/catalog/foundations')
export class FoundationCatalogController {
  constructor(private readonly listCatalogUseCase: ListFoundationCatalogUseCase) {}

  @Get()
  @ApiOperation({ summary: 'EP-008: List foundation catalog' })
  @ApiQuery({ name: 'kind', required: false, enum: ['CAISSON', 'FOOTING'] })
  async list(@Query('kind') kind?: FoundationKind) {
    return this.listCatalogUseCase.execute(kind);
  }
}
