import { FoundationKind, FoundationTypeCode } from '../../domain/entities/foundation.entity';

export interface LoadCapacity {
  compression: number;
  tension: number;
}

export interface FoundationCatalogItem {
  catalogRefId: string;
  kind: FoundationKind;
  typeCode: FoundationTypeCode;
  geometry: Record<string, number | Record<string, number> | null>;
  loadCapacity?: LoadCapacity;
  description?: string;
}

export abstract class FoundationCatalogRepository {
  abstract findById(catalogRefId: string): Promise<FoundationCatalogItem | null>;
  abstract findByKind(kind: FoundationKind): Promise<FoundationCatalogItem[]>;
  abstract findByTypeCode(typeCode: FoundationTypeCode): Promise<FoundationCatalogItem[]>;
  abstract findAll(): Promise<FoundationCatalogItem[]>;
}
