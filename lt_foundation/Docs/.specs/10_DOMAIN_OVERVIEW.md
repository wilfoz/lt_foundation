# 10 — Visão de Domínio (DDD + Clean Architecture + Hexagonal)

> Stack: Angular v20+, NestJS, Tailwind, Docker Compose, PostgreSQL. Código em **inglês**; specs em PT-BR. Ver `05_ARCHITECTURE_AND_STACK.md` para detalhes.

## 1. Objetivo
Estabelecer a linguagem ubíqua, os agregados, entidades e contextos limitados (bounded contexts) que sustentam o sistema de cálculo/validação/emissão de planilhas de fundações de torres de Linha de Transmissão (LT).

## 2. Escopo
**In scope**: modelagem do domínio para torres autoportantes e estaiadas; tipos de fundação Tubulão e Sapata; topografia/locação; cálculos; emissão.

**Out of scope**: cálculos estruturais da torre (mecânica do aço), análise geotécnica avançada, integração com ERPs.

## 3. Glossário (Linguagem Ubíqua)

| Termo | Definição |
|-------|-----------|
| Torre | Estrutura suporte da LT, classificada por tipo (autoportante, estaiada). |
| Perna | Apoio estrutural da torre autoportante; quatro pernas: A, B, C, D. |
| Mastro Central (MC) | Elemento central da torre estaiada. |
| Estai | Cabo/elemento tracionado da torre estaiada; quatro estais: A, B, C, D. |
| Fundação | Elemento estrutural enterrado: Tubulão ou Sapata. |
| Stub | Peça metálica embutida no concreto que conecta a torre à fundação. |
| Afloramento (Afl) | Altura do topo da fundação acima do nível natural do terreno. |
| PC | Ponto de Centro da torre (cota 100 de referência). |
| CC | Centro de Coordenação / ponto de controle. |
| PA1 / PA2 | Pontos de Apoio para alinhamento. |
| PF | Ponto Frontal (locação topográfica). |
| Nc | Cota natural do terreno no ponto da perna. |
| Ncc | Cota de cravamento/concretagem. |
| H | Profundidade total da fundação. |
| NFC | Nível de Fundo de Concretagem. |
| Bissetriz | Linha que divide o ângulo de deflexão da LT pela metade. |
| Deflexão | Ângulo horizontal entre os trechos da LT adjacentes à torre. |

## 4. Bounded Contexts (cada um vira um Módulo NestJS)

### 4.1 tower-catalog
- Agregados: `TowerType`, `Tower`.
- Responsabilidade: cadastrar tipos de torre (ex.: SL, ext. 6, Hu 21) e instâncias (torre 0/1).

### 4.2 foundation-design
- Agregados: `FoundationDesign`, `Leg`/`TowerElement`, `Foundation`.
- Responsabilidade: orquestrar seleção do tipo de fundação por perna/elemento e o cálculo.

### 4.3 survey
- Agregados: `LocationSurvey` (PC, CC, PA1, PA2, PF, PF-1, PF+3, Nc por ponto).
- Responsabilidade: locação topográfica e cotas.

### 4.4 spreadsheet-emission
- Agregados: `Spreadsheet`, `SheetSection`.
- Responsabilidade: gerar planilha final (Excel/PDF) com inputs, cálculos, validações e assinaturas.

### 4.5 Camadas (Clean Architecture) — aplicável a todos os contextos
```
modules/<context>/
├── domain/          # entidades, value objects, domain services, eventos
├── application/     # use cases (interactors), ports (interfaces)
├── infrastructure/  # adapters (Postgres, exporter, HTTP clients) — implementa ports
└── presentation/    # controllers NestJS, DTOs, mappers
```
Regra: dependências apontam **sempre para dentro** (Presentation/Infrastructure → Application → Domain).

## 5. Agregados e Entidades (Visão Unificada — TypeScript)

```ts
// Domain (TypeScript)
class Tower {                          // raiz de agregado
  id: TowerId;
  type: TowerType;                     // SL/SY/...
  extension: number;
  workingHeight: number;               // Hu
  deflectionAngle: Angle;              // {deg, min, sec, dir}
  classification: 'SELF_SUPPORTING' | 'GUYED';
  legs?: Leg[];                        // somente autoportante
  guyedElements?: {                    // somente estaiada
    centralMast: TowerElement;
    stays: TowerElement[];             // A, B, C, D
  };
}

class Leg { /* id: 'A'|'B'|'C'|'D' */
  id: LegId;
  foundation: Foundation;              // pode variar por perna
  surveyPoint: SurveyPoint;
  stub: Stub;
}

class TowerElement { /* MC ou A..D */
  id: ElementId;
  foundation: Foundation;
  surveyPoint: SurveyPoint;
  stay?: StayGeometry;                 // somente para estais
  stub: Stub;
}

abstract class Foundation {
  kind: 'CAISSON' | 'FOOTING';         // Tubulão | Sapata
  geometry: FoundationGeometry;
  reinforcement?: Reinforcement;
  volumes: VolumesVO;
  depth: DepthVO;
}
```

## 6. Inputs vs Outputs (alto nível)

| Input | Origem | Output (após motor de cálculo) |
|-------|--------|-------------------------------|
| Tipo de torre, extensão, Hu | Catálogo + projeto | Classificação automática (perna ou elemento) |
| Ângulo de deflexão | Projeto | Bissetriz, ângulos por perna/estai |
| Cotas Nc por ponto | Survey | Afl, NFC, H |
| Tipo de fundação por perna/elemento | Usuário | Volumes Vf/Vtc/Vb/VT/VE (Tubulão) ou V=LxBxH (Sapata) |
| Geometria da fundação | Banco de fundações | Locação S1..S4 (Sapata) ou eixo (Tubulão) |

## 7. Regras de Negócio (Globais)

- **RN-001**: Uma torre autoportante possui exatamente 4 pernas (A, B, C, D).
- **RN-002**: Uma torre estaiada possui 1 Mastro Central + 4 Estais (A, B, C, D).
- **RN-003**: Cada perna/elemento referencia **uma** fundação.
- **RN-004**: Tipos de fundação podem ser **diferentes entre pernas/elementos da mesma torre**.
- **RN-005**: O usuário é a fonte de verdade para a escolha do tipo de fundação por perna/elemento.
- **RN-006**: O motor de cálculo só executa quando todos os inputs obrigatórios estão preenchidos.
- **RN-007**: Parâmetros não fornecidos devem ser marcados como `unknown` e bloquear a emissão final da planilha (somente rascunho permitido).

## 8. Módulos/Serviços (Hexagonal + Clean Architecture)

### 8.1 Outbound Ports (em `application/ports/`)
- `TowerRepository`
- `FoundationCatalogRepository` (banco de fundações)
- `SurveyRepository`
- `FoundationCalculatorPort`
- `SpreadsheetExporterPort`
- `AuditLogPort`

### 8.2 Inbound Ports / Use Cases (em `application/use-cases/`)
- `SelectFoundationForLegUseCase` — registra seleção por perna.
- `SelectFoundationForElementUseCase` — registra seleção por MC/estai.
- `RunFoundationCalculationUseCase` — orquestra cálculo.
- `EmitSpreadsheetUseCase` — emite planilha final.
- `ValidateDesignUseCase` — agrega validações.

### 8.3 Adapters (em `infrastructure/` e `presentation/`)
- `PostgresTowerRepositoryAdapter` (TypeORM ou Prisma).
- `PostgresFoundationCatalogRepositoryAdapter`.
- `ExcelSpreadsheetExporterAdapter` (lib: `exceljs`).
- `PdfReportAdapter` (lib: `pdfkit` ou `puppeteer`). **unknown** — TODO.
- `TowerController` (NestJS REST controller).
- `CalculationController`, `SpreadsheetController`.

### 8.4 Frontend (Angular v20+)
- Feature folders por contexto (`features/tower`, `features/foundation`, `features/spreadsheet`).
- Standalone components, Signals, Control Flow.
- Tailwind para estilização; design tokens centralizados.

## 9. Critérios de Aceitação

- **CA-001**: Modelo de domínio permite representar autoportante (4 pernas) e estaiada (MC + 4 estais).
- **CA-002**: Modelo permite tipos de fundação distintos por perna/elemento.
- **CA-003**: Linguagem ubíqua aplicada em código (EN) e em UI/specs (PT-BR), com mapeamento explícito no `05_ARCHITECTURE_AND_STACK.md`.
- **CA-004**: Bounded contexts não compartilham agregados; comunicação por eventos ou DTOs.
- **CA-005**: Cada Domain Service (calculators) tem suíte de testes unitários (TDD) cobrindo casos de borda.
- **CA-006**: Cada Use Case tem suíte de testes com ports mockados.

## 10. TODO / Pendências
- Lista oficial de tipos de torre (SL, SY, etc.): **unknown** — TODO.
- Política de versionamento do banco de fundações: **unknown** — TODO.
