import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { TowerRepository } from '../ports/tower.repository';
import { SpreadsheetExporterPort } from '../ports/spreadsheet-exporter.port';
import { RunFoundationCalculationUseCase } from './run-foundation-calculation.use-case';
import { ValidationService } from '../../domain/services/validation.service';

export interface EmitSpreadsheetInput {
  towerId: string;
  format: 'XLSX' | 'PDF';
  draft: boolean;
}

@Injectable()
export class EmitSpreadsheetUseCase {
  private readonly validationService = new ValidationService();

  constructor(
    private readonly towerRepository: TowerRepository,
    private readonly spreadsheetExporter: SpreadsheetExporterPort,
    private readonly runCalculation: RunFoundationCalculationUseCase,
  ) {}

  async execute(input: EmitSpreadsheetInput) {
    const tower = await this.towerRepository.findById(input.towerId);
    if (!tower) throw new NotFoundException(`Tower ${input.towerId} not found`);

    const calculation = await this.runCalculation.execute(input.towerId);

    if (!input.draft) {
      this.validationService.assertEmissionAllowed(calculation.validations);
    }

    return this.spreadsheetExporter.export(tower, calculation, input.draft);
  }
}
