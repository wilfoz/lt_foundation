export abstract class DocumentStoragePort {
  abstract store(filename: string, buffer: Buffer): Promise<string>;
  abstract retrieve(storageKey: string): Promise<Buffer>;
  abstract delete(storageKey: string): Promise<void>;
}
