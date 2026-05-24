import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as FormData from 'form-data';
import fetch from 'node-fetch';
import {
  DocumentAiPort,
  OcrPageResult,
  OcrRegionResult,
} from '../../application/ports/document-ai.port';

@Injectable()
export class DoctrHttpAdapter extends DocumentAiPort {
  private readonly logger = new Logger(DoctrHttpAdapter.name);
  private readonly baseUrl: string;

  constructor(config: ConfigService) {
    super();
    this.baseUrl = config.get<string>('OCR_SERVICE_URL', 'http://localhost:8100');
  }

  async ocrPage(buffer: Buffer, filename: string, page = 0): Promise<OcrPageResult> {
    const form = new FormData();
    form.append('file', buffer, { filename, contentType: this.mimeType(filename) });
    form.append('page', String(page));

    return this.post<OcrPageResult>('/ocr', form);
  }

  async ocrRegion(
    buffer: Buffer,
    filename: string,
    bbox: { x: number; y: number; w: number; h: number },
    page = 0,
  ): Promise<OcrRegionResult> {
    const form = new FormData();
    form.append('file', buffer, { filename, contentType: this.mimeType(filename) });
    form.append('x', String(bbox.x));
    form.append('y', String(bbox.y));
    form.append('w', String(bbox.w));
    form.append('h', String(bbox.h));
    form.append('page', String(page));

    return this.post<OcrRegionResult>('/ocr/region', form);
  }

  private async post<T>(path: string, form: FormData): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    try {
      const res = await fetch(url, { method: 'POST', body: form, headers: form.getHeaders() });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`OCR service returned ${res.status}: ${text}`);
      }
      return res.json() as Promise<T>;
    } catch (err: any) {
      this.logger.error(`OCR service call failed: ${err.message}`);
      throw new ServiceUnavailableException(`OCR service unavailable: ${err.message}`);
    }
  }

  private mimeType(filename: string): string {
    if (filename.toLowerCase().endsWith('.pdf')) return 'application/pdf';
    if (filename.toLowerCase().endsWith('.png')) return 'image/png';
    return 'image/jpeg';
  }
}
