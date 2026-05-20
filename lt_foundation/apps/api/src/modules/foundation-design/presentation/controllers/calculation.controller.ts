import { Controller, Post, Get, Param, Res, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RunFoundationCalculationUseCase } from '../../application/use-cases/run-foundation-calculation.use-case';
import { EmitSpreadsheetUseCase } from '../../application/use-cases/emit-spreadsheet.use-case';
import { ValidationService } from '../../domain/services/validation.service';
import { TowerRepository } from '../../application/ports/tower.repository';

class EmitSpreadsheetInputDto {
  format: 'XLSX' | 'PDF' = 'XLSX';
  draft: boolean = false;
}

@ApiTags('calculation')
@Controller('api/v1/towers/:towerId')
export class CalculationController {
  private readonly validationService = new ValidationService();

  constructor(
    private readonly runCalculation: RunFoundationCalculationUseCase,
    private readonly emitSpreadsheet: EmitSpreadsheetUseCase,
    private readonly towerRepository: TowerRepository,
  ) {}

  @Post('calculate')
  @ApiOperation({ summary: 'EP-009: Run foundation calculation' })
  async calculate(@Param('towerId') towerId: string) {
    return this.runCalculation.execute(towerId);
  }

  @Get('validations')
  @ApiOperation({ summary: 'EP-010: Get validations for tower' })
  async getValidations(@Param('towerId') towerId: string) {
    const tower = await this.towerRepository.findById(towerId);
    if (!tower) return { validations: [] };
    return { validations: this.validationService.validate(tower) };
  }

  @Post('spreadsheet')
  @ApiOperation({ summary: 'EP-011: Emit spreadsheet' })
  async handleSpreadsheetEmission(
    @Param('towerId') towerId: string,
    @Body() dto: EmitSpreadsheetInputDto,
    @Res() res: Response,
  ) {
    const result = await this.emitSpreadsheet.execute({ towerId, format: dto.format, draft: dto.draft });
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${result.filename}"`,
    });
    res.send(result.buffer);
  }
}
