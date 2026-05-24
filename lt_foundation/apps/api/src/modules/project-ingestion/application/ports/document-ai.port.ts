export interface OcrWord {
  value: string;
  confidence: number;
  geometry: { x: number; y: number; w: number; h: number };
}

export interface OcrPageResult {
  words: OcrWord[];
  page: number;
  totalPages: number;
}

export interface OcrRegionResult {
  words: OcrWord[];
  region: { x: number; y: number; w: number; h: number };
}

export abstract class DocumentAiPort {
  /** OCR a full page of a PDF or image file. */
  abstract ocrPage(buffer: Buffer, filename: string, page?: number): Promise<OcrPageResult>;

  /** OCR only the bounding-box region returned by Roboflow (faster). */
  abstract ocrRegion(
    buffer: Buffer,
    filename: string,
    bbox: { x: number; y: number; w: number; h: number },
    page?: number,
  ): Promise<OcrRegionResult>;
}
