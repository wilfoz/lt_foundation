# 70 — Contratos / API (NestJS)

> Backend: NestJS. Frontend consumidor: Angular v20+. Persistência: PostgreSQL. Ver `05_ARCHITECTURE_AND_STACK.md`.

## 1. Objetivo
Definir os **contratos de alto nível** (DTOs) e **endpoints REST** para o sistema NestJS. Não detalha autenticação, paginação ou versionamento avançado.

## 2. Escopo
**In scope**: DTOs principais, endpoints REST sugeridos, payloads de exemplo.

**Out of scope**: implementação de adapters específicos, autenticação OAuth, esquema de banco.

## 3. Convenções
- REST, JSON, `Content-Type: application/json`.
- Prefixo global: `/api/v1`.
- IDs em string (UUID v4).
- Ângulos enviados como `{ deg, min, sec, dir? }`.
- Unidades em SI.
- DTOs com `class-validator` (`@IsString()`, `@IsNumber()`, `@ValidateNested()`).
- Documentação automática via `@nestjs/swagger`.
- Nomenclatura em **inglês**: `TowerDto`, `LegDto`, `GuyedElementDto`, etc.
- Erros padronizados com `HttpException` e filtro global de exceções.

## 4. DTOs (Alto Nível)

### 4.1 TowerDTO
```json
{
  "id": "uuid",
  "type": "SL",
  "extension": 6,
  "Hu": 21,
  "classification": "SELF_SUPPORTING",
  "deflectionAngle": { "deg": 60, "min": 19, "sec": 54, "dir": "D" }
}
```

### 4.2 LegDto (Autoportante)
```json
{
  "id": "A",
  "foundation": { "kind": "CAISSON", "catalogRefId": "catalog-caisson-001" },
  "survey": { "naturalElevation": 100.42, "concreteCastingElevation": 98.10, "distance": 2.50 },
  "stub": { "type": "S-1", "length": 1.8, "embedment": 0.6, "inclination": 5.2 }
}
```

### 4.3 GuyedElementDto (Estaiada)
```json
{
  "id": "MC" /* ou 'A'..'D' */,
  "foundation": { "kind": "FOOTING", "catalogRefId": "catalog-footing-014" },
  "survey": { "naturalElevation": 100.10, "concreteCastingElevation": 98.00 },
  "stay": {
    "horizontalAngle": { "deg": 90, "min": 0, "sec": 0 },
    "inclinationAngle": 45.0
  },
  "stub": { "type": "S-3", "length": 2.1, "embedment": 0.7 }
}
```

### 4.4 FoundationCatalogItemDto
```json
{
  "catalogRefId": "catalog-caisson-001",
  "kind": "CAISSON",
  "geometry": { "shaftDiameter": 0.8, "baseDiameter": 1.4, "shaftHeight": 3.0, "frustumHeight": 0.4, "baseHeight": 0.8 },
  "reinforcement": null
}
```

> Enum `kind`: `CAISSON` (Tubulão) | `FOOTING` (Sapata).

### 4.5 CalculationResultDTO
```json
{
  "towerId": "uuid",
  "bisector": 30.3317,
  "perElement": [
    {
      "elementId": "A",
      "Afl": 2.32, "G": 4.82, "H": 4.20, "NFC": 93.90,
      "volumes": { "Vf": 1.51, "Vtc": 0.35, "Vb": 1.23, "VT": 3.09, "VE": 3.40 }
    }
  ],
  "validations": [ { "id": "V-015", "severity": "ALERT", "message": "..." } ],
  "partial": false
}
```

### 4.6 SpreadsheetEmissionDTO
```json
{
  "towerId": "uuid",
  "format": "XLSX" /* ou "PDF" */,
  "draft": false
}
```

## 5. Endpoints Sugeridos

| ID | Método | Path | Controller (NestJS) | Use Case |
|----|--------|------|---------------------|----------|
| EP-001 | POST | `/api/v1/towers` | `TowerController` | `CreateTowerUseCase` |
| EP-002 | GET | `/api/v1/towers/{id}` | `TowerController` | `GetTowerUseCase` |
| EP-003 | PUT | `/api/v1/towers/{id}` | `TowerController` | `UpdateTowerUseCase` |
| EP-004 | POST | `/api/v1/towers/{id}/legs` | `LegController` | `UpsertLegUseCase` |
| EP-005 | POST | `/api/v1/towers/{id}/guyed` | `GuyedController` | `UpsertGuyedElementsUseCase` |
| EP-006 | PUT | `/api/v1/towers/{id}/legs/{legId}/foundation` | `LegController` | `SelectFoundationForLegUseCase` |
| EP-007 | PUT | `/api/v1/towers/{id}/elements/{elementId}/foundation` | `GuyedController` | `SelectFoundationForElementUseCase` |
| EP-008 | GET | `/api/v1/catalog/foundations?kind=CAISSON\|FOOTING` | `FoundationCatalogController` | `ListFoundationCatalogUseCase` |
| EP-009 | POST | `/api/v1/towers/{id}/calculate` | `CalculationController` | `RunFoundationCalculationUseCase` |
| EP-010 | GET | `/api/v1/towers/{id}/validations` | `ValidationController` | `ListValidationsUseCase` |
| EP-011 | POST | `/api/v1/towers/{id}/spreadsheet` | `SpreadsheetController` | `EmitSpreadsheetUseCase` |
| EP-012 | GET | `/api/v1/towers/{id}/spreadsheet/{emissionId}` | `SpreadsheetController` | `DownloadSpreadsheetUseCase` |

## 6. Exemplos de Requisição/Resposta

### 6.1 Selecionar Fundação por Perna
`PUT /towers/{id}/legs/A/foundation`
```json
{ "foundation": { "kind": "TUBULAO", "refId": "catalog-tub-001" } }
```

Resposta `200`:
```json
{ "legId": "A", "foundation": { "kind": "TUBULAO", "refId": "catalog-tub-001" } }
```

### 6.2 Calcular
`POST /towers/{id}/calculate` → retorna `CalculationResultDTO`.

### 6.3 Emitir
`POST /towers/{id}/spreadsheet`
```json
{ "format": "XLSX", "draft": false }
```
Resposta:
```json
{ "emissionId": "uuid", "status": "READY", "url": "/towers/{id}/spreadsheet/{emissionId}" }
```

Se houver validação bloqueante:
```json
{ "error": "EMISSION_BLOCKED", "validations": [ { "id": "V-005", "severity": "BLOCKING" } ] }
```

## 7. Códigos de Erro Sugeridos

| Código | Significado |
|--------|-------------|
| `INVALID_INPUT` | Payload inválido. |
| `FOUNDATION_KIND_REQUIRED` | Falta seleção de tipo por perna/elemento. |
| `EMISSION_BLOCKED` | Validações bloqueantes ativas. |
| `CATALOG_REF_NOT_FOUND` | refId do banco não existe. |
| `PARTIAL_DESIGN` | Inputs `unknown` impedem operação solicitada. |

## 8. Módulos/Serviços (NestJS + Hexagonal)

### 8.1 Estrutura de Módulo
```
modules/foundation-design/
├── domain/
│   ├── entities/ (Tower, Leg, Foundation)
│   ├── value-objects/ (Angle, VolumesVO)
│   └── services/ (CaissonVolumeCalculator, FootingVolumeCalculator)
├── application/
│   ├── ports/ (TowerRepository, CalculatorPort)
│   └── use-cases/ (RunFoundationCalculationUseCase, ...)
├── infrastructure/
│   ├── persistence/ (PostgresTowerRepositoryAdapter)
│   └── export/ (ExcelSpreadsheetExporterAdapter)
├── presentation/
│   ├── controllers/ (TowerController)
│   ├── dtos/ (TowerDto, LegDto)
│   └── mappers/
└── foundation-design.module.ts
```

### 8.2 Bindings NestJS (DI)
- Ports são `abstract class` + token `@Inject(TowerRepository)` no use case.
- O módulo declara `{ provide: TowerRepository, useClass: PostgresTowerRepositoryAdapter }`.

### 8.3 TDD
- Cada `*.use-case.ts` tem seu `*.use-case.spec.ts` (mockando ports).
- Cada calculator (domain service) tem `*.spec.ts` puro.
- Cada controller tem `*.controller.spec.ts` com `Test.createTestingModule()`.
- Adapters: `*.int-spec.ts` com Postgres via Testcontainers.

## 9. Critérios de Aceitação
- **CA-701**: Todos os endpoints listados retornam contratos descritos.
- **CA-702**: Mistura de tipos de fundação por perna/elemento é suportada via `EP-006`/`EP-007`.
- **CA-703**: Tentar emitir final com validação bloqueante retorna `EMISSION_BLOCKED`.
- **CA-704**: Resultados de cálculo incluem `partial: true` quando há `unknown`.

## 10. TODO / Pendências
- Autenticação/autorização: **unknown** — TODO.
- Esquema de versionamento de API (v1, v2): **unknown** — TODO.
- Política de cache para o catálogo de fundações: **unknown** — TODO.
- Webhooks ou eventos pós-emissão: **unknown** — TODO.
