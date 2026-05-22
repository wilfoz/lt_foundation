import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { DocumentType, ProjectType } from '../../domain/entities/project-document.entity';
import { DocumentParserPort, ParsedProjectData } from '../../application/ports/document-parser.port';

@Injectable()
export class XlsParserAdapter implements DocumentParserPort {
  async parse(
    buffer: Buffer,
    documentType: DocumentType,
    projectType: ProjectType,
  ): Promise<ParsedProjectData> {
    if (documentType !== 'XLS') {
      throw new Error(`XlsParserAdapter does not handle ${documentType}`);
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);

    const warnings: string[] = [];

    const towerParams = this.extractTowerSheet(workbook, warnings);
    const legs = this.extractLegsSheet(workbook, warnings, projectType);
    const elements = this.extractElementsSheet(workbook, warnings, projectType);

    return { towerParams, legs, elements, confidence: 0.8, warnings };
  }

  private extractTowerSheet(
    workbook: ExcelJS.Workbook,
    warnings: string[],
  ): Record<string, unknown> {
    const sheet = workbook.getWorksheet('Torre') ?? workbook.getWorksheet('Tower') ?? workbook.worksheets[0];
    if (!sheet) {
      warnings.push('No tower sheet found');
      return {};
    }

    const params: Record<string, unknown> = {};
    sheet.eachRow((row) => {
      const key = String(row.getCell(1).value ?? '').trim();
      const val = row.getCell(2).value;
      if (key) params[key] = val;
    });
    return params;
  }

  private extractLegsSheet(
    workbook: ExcelJS.Workbook,
    warnings: string[],
    projectType: ProjectType,
  ): Record<string, unknown>[] {
    if (projectType === 'GUYED_HEIGHT_LOCATION' || projectType === 'GUYED_FOUNDATION') return [];

    const sheet = workbook.getWorksheet('Pernas') ?? workbook.getWorksheet('Legs');
    if (!sheet) {
      warnings.push('No legs sheet found');
      return [];
    }

    const rows: Record<string, unknown>[] = [];
    const headers: string[] = [];

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) {
        row.eachCell((cell) => headers.push(String(cell.value ?? '').trim()));
        return;
      }
      const obj: Record<string, unknown> = {};
      row.eachCell((cell, colNumber) => {
        const header = headers[colNumber - 1];
        if (header) obj[header] = cell.value;
      });
      if (Object.keys(obj).length > 0) rows.push(obj);
    });

    return rows;
  }

  private extractElementsSheet(
    workbook: ExcelJS.Workbook,
    warnings: string[],
    projectType: ProjectType,
  ): Record<string, unknown>[] {
    if (projectType === 'SELF_SUPPORTING_STUBS' || projectType === 'SELF_SUPPORTING_FOUNDATION') return [];

    const sheet = workbook.getWorksheet('Estais') ?? workbook.getWorksheet('Elements');
    if (!sheet) {
      warnings.push('No elements sheet found');
      return [];
    }

    const rows: Record<string, unknown>[] = [];
    const headers: string[] = [];

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) {
        row.eachCell((cell) => headers.push(String(cell.value ?? '').trim()));
        return;
      }
      const obj: Record<string, unknown> = {};
      row.eachCell((cell, colNumber) => {
        const header = headers[colNumber - 1];
        if (header) obj[header] = cell.value;
      });
      if (Object.keys(obj).length > 0) rows.push(obj);
    });

    return rows;
  }
}
