import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { DocumentStoragePort } from '../../application/ports/document-storage.port';

@Injectable()
export class LocalFileStorageAdapter implements DocumentStoragePort {
  private readonly uploadDir: string;

  constructor(private readonly config: ConfigService) {
    this.uploadDir = config.get<string>('UPLOAD_DIR', './uploads/projects');
  }

  async store(filename: string, buffer: Buffer): Promise<string> {
    await fs.mkdir(this.uploadDir, { recursive: true });
    const ext = path.extname(filename);
    const storageKey = `${uuidv4()}${ext}`;
    await fs.writeFile(path.join(this.uploadDir, storageKey), buffer);
    return storageKey;
  }

  async retrieve(storageKey: string): Promise<Buffer> {
    const data = await fs.readFile(path.join(this.uploadDir, storageKey));
    return Buffer.from(data);
  }

  async delete(storageKey: string): Promise<void> {
    await fs.unlink(path.join(this.uploadDir, storageKey));
  }
}
