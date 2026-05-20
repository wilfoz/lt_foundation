import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { v4 as uuidv4 } from 'uuid';
import { SpreadsheetExporterPort, SpreadsheetExportResult } from '../../application/ports/spreadsheet-exporter.port';
import { Tower } from '../../domain/entities/tower.entity';
import { CalculationResultDto } from '@lt/shared-dtos';

@Injectable()
export class ExcelSpreadsheetAdapter implements SpreadsheetExporterPort {
  async export(tower: Tower, calculation: CalculationResultDto, draft: boolean): Promise<SpreadsheetExportResult> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'LT Foundation System';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Fundações', {
      pageSetup: { paperSize: 9, orientation: 'landscape' },
    });

    // Header
    sheet.mergeCells('A1:H1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = draft ? 'PLANILHA DE FUNDAÇÕES — RASCUNHO' : 'PLANILHA DE FUNDAÇÕES';
    titleCell.font = { bold: true, size: 14 };
    titleCell.alignment = { horizontal: 'center' };
    if (draft) titleCell.font = { ...titleCell.font, color: { argb: 'FFCC0000' } };

    // Tower info
    sheet.addRow([]);
    sheet.addRow(['Torre:', tower.type, 'Extensão:', tower.extension, 'Hu:', tower.Hu, 'Classificação:', tower.classification]);
    sheet.addRow(['Bissetriz (°):', calculation.bisector.toFixed(6)]);
    sheet.addRow([]);

    // Results table header
    const headerRow = sheet.addRow([
      'Elemento', 'Afl (m)', 'G (m)', 'H (m)', 'NFC (m)',
      'V. Concreto (m³)', 'V. Escavação (m³)', 'Status',
    ]);
    headerRow.font = { bold: true };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };

    for (const el of calculation.perElement) {
      const totalVolume = 'totalVolume' in el.volumes ? el.volumes.totalVolume : 0;
      const excavationVolume = 'excavationVolume' in el.volumes ? el.volumes.excavationVolume : 0;
      const validations = calculation.validations.filter((v) => v.elementId === el.elementId);
      const status = validations.some((v) => v.severity === 'BLOCKING') ? 'BLOQUEADO' : validations.some((v) => v.severity === 'ALERT') ? 'ALERTA' : 'OK';

      const dataRow = sheet.addRow([
        el.elementId,
        el.Afl.toFixed(4),
        el.G.toFixed(4),
        el.H.toFixed(4),
        el.NFC.toFixed(4),
        totalVolume.toFixed(4),
        excavationVolume.toFixed(4),
        status,
      ]);

      if (status === 'BLOQUEADO') {
        dataRow.getCell(8).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCE4D6' } };
      } else if (status === 'ALERTA') {
        dataRow.getCell(8).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFCC' } };
      } else {
        dataRow.getCell(8).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2EFDA' } };
      }
    }

    // Validations
    if (calculation.validations.length > 0) {
      sheet.addRow([]);
      sheet.addRow(['Validações:']);
      for (const v of calculation.validations) {
        sheet.addRow([v.id, v.severity, v.message]);
      }
    }

    // Autofit columns
    sheet.columns.forEach((col) => { col.width = 18; });

    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
    const emissionId = uuidv4();
    const filename = `fundacoes_torre_${tower.type}_${emissionId}.xlsx`;

    return { emissionId, buffer, filename };
  }
}
