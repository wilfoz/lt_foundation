import { Tower } from '../../domain/entities/tower.entity';
import { CalculationResultDto } from '@lt/shared-dtos';

export interface SpreadsheetExportResult {
  emissionId: string;
  buffer: Buffer;
  filename: string;
}

export abstract class SpreadsheetExporterPort {
  abstract export(tower: Tower, calculation: CalculationResultDto, draft: boolean): Promise<SpreadsheetExportResult>;
}
