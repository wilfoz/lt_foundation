import { Controller, Post, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RecalculateWithFieldDataUseCase } from '../../application/use-cases/recalculate-with-field-data.use-case';
import { RecalculateWithFieldDataDto } from '../dtos/field-recalculation.dto';

@ApiTags('calculation')
@Controller('api/v1/towers')
export class FieldRecalculationController {
  constructor(private readonly recalculate: RecalculateWithFieldDataUseCase) {}

  @Post(':towerId/recalculate')
  @ApiOperation({ summary: 'EP-017 — Apply field survey data and recalculate tower geometry' })
  async recalculateWithFieldData(
    @Param('towerId') towerId: string,
    @Body() dto: RecalculateWithFieldDataDto,
  ) {
    return this.recalculate.execute({
      towerId,
      legs: dto.legs,
      elements: dto.elements,
    });
  }
}
