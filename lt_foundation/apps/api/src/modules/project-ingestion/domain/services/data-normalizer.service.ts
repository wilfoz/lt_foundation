import {
  ExtractedTowerParams,
  ExtractedLegParams,
  ExtractedElementParams,
} from '../entities/extracted-data.entity';

export class DataNormalizerService {
  normalizeTowerParams(raw: Record<string, unknown>): ExtractedTowerParams {
    return {
      type: this.asString(raw['type'] ?? raw['tipo']),
      extension: this.asNumber(raw['extension'] ?? raw['extensao'] ?? raw['extensão']),
      Hu: this.asNumber(raw['Hu'] ?? raw['hu'] ?? raw['altura']),
      classification: this.normalizeClassification(raw['classification'] ?? raw['tipo_torre']),
      deflectionAngle: this.normalizeAngle(raw['deflectionAngle'] ?? raw['angulo_deflexao']),
    };
  }

  normalizeLegParams(rawRows: Record<string, unknown>[]): ExtractedLegParams[] {
    return rawRows.map((row) => ({
      legId: this.asLegId(row['legId'] ?? row['perna']),
      naturalElevation: this.asNumber(row['naturalElevation'] ?? row['Nc']),
      concreteCastingElevation: this.asNumber(row['concreteCastingElevation'] ?? row['Ncc']),
      distance: this.asNumber(row['distance'] ?? row['distancia'] ?? row['distância']),
      stubType: this.asString(row['stubType'] ?? row['tipo_stub']),
      stubLength: this.asNumber(row['stubLength'] ?? row['comprimento_stub']),
      stubEmbedment: this.asNumber(row['stubEmbedment'] ?? row['embutimento']),
      stubInclination: this.asNumber(row['stubInclination'] ?? row['inclinacao']),
      foundationCatalogRefId: this.asString(row['foundationCatalogRefId'] ?? row['fundacao']),
      foundationAzimuth: this.asNumber(row['foundationAzimuth'] ?? row['azimute']),
    }));
  }

  normalizeElementParams(rawRows: Record<string, unknown>[]): ExtractedElementParams[] {
    return rawRows.map((row) => ({
      elementId: this.asElementId(row['elementId'] ?? row['elemento']),
      naturalElevation: this.asNumber(row['naturalElevation'] ?? row['Nc']),
      concreteCastingElevation: this.asNumber(row['concreteCastingElevation'] ?? row['Ncc']),
      distance: this.asNumber(row['distance'] ?? row['distancia']),
      stayHorizontalAngleDeg: this.asNumber(row['stayHorizontalAngleDeg'] ?? row['angulo_horizontal']),
      stayInclinationAngleDeg: this.asNumber(row['stayInclinationAngleDeg'] ?? row['inclinacao_estai']),
      foundationCatalogRefId: this.asString(row['foundationCatalogRefId'] ?? row['fundacao']),
    }));
  }

  private asString(v: unknown): string | undefined {
    return v != null ? String(v).trim() || undefined : undefined;
  }

  private asNumber(v: unknown): number | undefined {
    if (v == null) return undefined;
    const n = Number(v);
    return isNaN(n) ? undefined : n;
  }

  private asLegId(v: unknown): 'A' | 'B' | 'C' | 'D' {
    const s = String(v).toUpperCase().trim();
    if (s === 'A' || s === 'B' || s === 'C' || s === 'D') return s;
    throw new Error(`Invalid LegId: ${v}`);
  }

  private asElementId(v: unknown): 'MC' | 'A' | 'B' | 'C' | 'D' {
    const s = String(v).toUpperCase().trim();
    if (s === 'MC' || s === 'A' || s === 'B' || s === 'C' || s === 'D') return s;
    throw new Error(`Invalid ElementId: ${v}`);
  }

  private normalizeClassification(v: unknown): 'SELF_SUPPORTING' | 'GUYED' | undefined {
    if (!v) return undefined;
    const s = String(v).toUpperCase().trim();
    if (s === 'SELF_SUPPORTING' || s === 'AUTOPORTANTE') return 'SELF_SUPPORTING';
    if (s === 'GUYED' || s === 'ESTAIADA') return 'GUYED';
    return undefined;
  }

  private normalizeAngle(v: unknown): { deg: number; min: number; sec: number; dir?: 'D' | 'E' } | undefined {
    if (!v || typeof v !== 'object') return undefined;
    const obj = v as Record<string, unknown>;
    return {
      deg: this.asNumber(obj['deg'] ?? obj['graus']) ?? 0,
      min: this.asNumber(obj['min'] ?? obj['minutos']) ?? 0,
      sec: this.asNumber(obj['sec'] ?? obj['segundos']) ?? 0,
      dir: obj['dir'] === 'D' || obj['dir'] === 'E' ? obj['dir'] : undefined,
    };
  }
}
