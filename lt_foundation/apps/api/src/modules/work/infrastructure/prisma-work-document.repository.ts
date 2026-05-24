import { Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../../shared/prisma.service';

export type DocumentFileType = 'PDF' | 'XLS' | 'DWG';

const UPLOAD_DIR = process.env['UPLOAD_DIR'] ?? './uploads/obras';

@Injectable()
export class PrismaWorkDocumentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByWorkId(workId: string) {
    return this.prisma.workDocument.findMany({
      where: { workId },
      orderBy: { uploadedAt: 'desc' },
      select: { id: true, fileName: true, fileType: true, pipelineStatus: true, uploadedAt: true },
    });
  }

  async create(params: {
    workId: string;
    fileName: string;
    fileType: DocumentFileType;
    buffer: Buffer;
    uploadedById: string;
  }) {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    const ext = path.extname(params.fileName);
    const storageKey = `${uuidv4()}${ext}`;
    await fs.writeFile(path.join(UPLOAD_DIR, storageKey), params.buffer);

    return this.prisma.workDocument.create({
      data: {
        workId: params.workId,
        fileName: params.fileName,
        fileType: params.fileType,
        storageKey,
        uploadedById: params.uploadedById,
      },
      select: { id: true, fileName: true, fileType: true, pipelineStatus: true, uploadedAt: true },
    });
  }
}
