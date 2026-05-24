# 10 — Visão de Domínio (DDD + Clean Architecture + Hexagonal)

> Stack: Angular v20+, NestJS, Tailwind, Docker Compose, PostgreSQL 16, Prisma. Código em **inglês**; specs em PT-BR. Ver `05_ARCHITECTURE_AND_STACK.md` para detalhes.

## 1. Objetivo
Estabelecer a linguagem ubíqua, os agregados, entidades e contextos limitados (bounded contexts) que sustentam a plataforma de cálculo, validação e emissão de planilhas de fundações de torres de Linha de Transmissão (LT), incluindo o pipeline híbrido de ingestão de documentos.

## 2. Escopo
**In scope**: modelagem do domínio para obras (raiz do sistema), torres autoportantes e estaiadas, tipos de fundação autoportante (BR/TCB/S/SES/EST/ESTH) e estaiada mastro (TSBM/TCBM/SPRM/SPPM/BRM/ESTM/ESTHM) e estaiada estais (TSBE/TCBE/VPME/ESTE/ESTHE), ingestão de documentos, validação humana, dados teóricos vs campo, topografia/locação, cálculos, emissão.

**Out of scope**: cálculos estruturais da torre (mecânica do aço), análise geotécnica avançada, integração com ERPs.

## 3. Glossário (Linguagem Ubíqua)

| Termo PT-BR | EN (código) | Definição |
|-------------|-------------|-----------|
| Obra | `Work` | Conjunto de torres de uma LT sob um contrato. **Raiz do sistema.** |
| Torre | `Tower` | Estrutura suporte da LT, classificada por tipo. |
| Torre Autoportante | `SelfSupportingTower` | Torre com 4 pernas A, B, C, D. |
| Torre Estaiada | `GuyedTower` | Torre com 1 ou 2 MC + 4 estais A, B, C, D. |
| Perna | `Leg` | Apoio estrutural da autoportante (A/B/C/D). |
| Mastro Central | `CentralMast` | Elemento central da estaiada. |
| Estai | `Stay` | Elemento tracionado da estaiada (A/B/C/D). |
| Fundação | `Foundation` | Elemento estrutural enterrado. Código: `{Tipo}-{TipoTorre}-{Tamanho}` ex.: `BR-N5SSE-VI`. |
| BR | Bloco Ancorado em Rocha | Autoportante — pernas. Fuste + bloco; afloramento de rocha. |
| TCB | Tubulão a Céu Aberto | Autoportante — pernas. Escavação circular; armadura helicoidal. |
| S | Sapata | Autoportante — pernas. Fundação rasa retangular. |
| SES | Sapata Especial | Autoportante — pernas. Sapata com reforço adicional. |
| EST | Estaca | Autoportante — pernas. Fundação profunda, solo mole. |
| ESTH | Estaca Hélice | Autoportante — pernas. Estaca moldada in loco. |
| TSBM | Tubulão Simples Bloco Mastro | Estaiada — mastro central. Seção constante. |
| TCBM | Tubulão c/ Base Alargada Mastro | Estaiada — mastro central. Base > fuste. |
| SPRM | Sapata Piramidal Radier Mastro | Estaiada — mastro central. Solo firme. |
| SPPM | Sapata Piramidal c/ Placa Mastro | Estaiada — mastro central. Com placa metálica. |
| BRM | Bloco de Rocha Mastro | Estaiada — mastro central. Ancorado em rocha. |
| ESTM | Estaca Metálica Mastro | Estaiada — mastro central. Solo instável. |
| ESTHM | Estaca Hélice Mastro | Estaiada — mastro central. Solo especial. |
| TSBE | Tubulão Simples Bloco Estai | Estaiada — estais. Seção constante. |
| TCBE | Tubulão c/ Base Alargada Estai | Estaiada — estais. Base > fuste. |
| VPME | Viga de Placa Metálica Estai | Estaiada — estais. Solo firme; Cota CC especial. |
| ESTE | Estaca Estai | Estaiada — estais. Solo mole. |
| ESTHE | Estaca Hélice Estai | Estaiada — estais. Solo especial. |
| Stub | `stub` | Peça metálica embutida no concreto. |
| Afloramento | `protrusion` | Altura acima do nível natural do terreno. |
| PC | `referencePoint` | Ponto de Centro da torre (cota 100 de referência). |
| PA1 / PA2 | `alignmentPoints` | Pontos de apoio para alinhamento topográfico. |
| PF | `frontPoint` | Ponto Frontal (locação topográfica). |
| Nc | `naturalElevation` | Cota natural do terreno. |
| Ncc | `concreteCastingElevation` | Cota de cravamento/concretagem. |
| H | `depth` | Profundidade total da fundação. |
| NFC | `concreteBottomLevel` | Nível de Fundo de Concretagem. |
| Bissetriz | `bisector` | Metade do ângulo de deflexão da LT. |
| Deflexão | `deflectionAngle` | Ângulo horizontal entre trechos adjacentes. |
| Dado Teórico | `theoreticalData` | Parâmetro de projeto (antes da execução). |
| Dado de Campo | `fieldData` | Parâmetro medido/coletado em campo. |
| Job de Ingestão | `IngestionJob` | Execução do pipeline para um documento. |
| Item de Revisão | `ReviewItem` | ParsedRecord aguardando aprovação humana. |
| Confiança | `confidence` | Score [0,1] de certeza da extração por IA. |

## 4. Bounded Contexts (cada um = um Módulo NestJS)

### 4.1 auth
- **Agregado raiz**: `User`.
- Responsabilidade: login, JWT, perfis RBAC (`ADMIN`, `ENGINEER`, `REVIEWER`, `VIEWER`), `SystemAuditLog`.
- Ver `45_AUTH.md`.

### 4.2 obra
- **Agregado raiz**: `Work` — **raiz de todo o sistema**.
- Contém: `WorkTower[]`, `WorkDocument[]`.
- Responsabilidade: criar/gerenciar obras; associar torres e documentos; derivar status.
- Ver `15_OBRA.md`.

### 4.3 tower-catalog
- **Agregado raiz**: `Tower`.
- Responsabilidade: tipos de torre (SL, SY…), extensão, Hu, classificação (autoportante/estaiada).

### 4.4 document-ingestion
- **Agregado raiz**: `IngestionJob`.
- Responsabilidade: upload PDF/Excel → Roboflow → OCR/Document AI → Parser → fila de validação.
- Ver `25_DOCUMENT_INGESTION.md`.

### 4.5 human-validation
- **Agregado raiz**: `ReviewItem`.
- Responsabilidade: fila de revisão, edição de campos extraídos, aprovação/rejeição, auditoria.
- Ver `35_VALIDATION_HUMANA.md`.

### 4.6 foundation-catalog
- **Agregado raiz**: `FoundationCatalogItem`.
- Responsabilidade: catálogo tipificado TM/TBM/TE/TBE/TR/TB/S/BR/SM/SPM/VE/BST; versionamento; compatibilidade com stub.
- Ver `55_CATALOGO_FUNDACOES.md`.

### 4.7 foundation-design
- **Agregados**: `FoundationDesign`, `Leg`/`TowerElement`, `Foundation`.
- Responsabilidade: orquestrar seleção do tipo de fundação e o motor de cálculo.

### 4.8 survey
- **Agregado raiz**: `LocationSurvey`.
- Responsabilidade: cotas (Nc, Ncc, PC, PA1, PA2, PF), locação topográfica.

### 4.9 report-emission
- **Agregado raiz**: `FoundationReport`.
- Responsabilidade: exibir página web com inputs, cálculos e validações da fundação; permitir exportação de relatório (XLSX/PDF) sob demanda.

### 4.10 Camadas (Clean Architecture) — aplicável a todos os contextos
```
modules/<context>/
├── domain/          # entidades, value objects, domain services, eventos
├── application/     # use cases (interactors), ports (interfaces)
├── infrastructure/  # adapters (Postgres, Roboflow, OCR, S3) — implementa ports
└── presentation/    # controllers NestJS, DTOs, mappers
```
Regra: dependências apontam **sempre para dentro** (Infrastructure/Presentation → Application → Domain).

## 5. Agregados e Entidades (Visão Unificada)

### 5.1 Work (Obra — raiz do sistema)
```ts
class Work {
  id: WorkId;
  name: string;
  contractNumber: string;
  status: WorkStatus;          // DRAFT | IN_PROGRESS | COMPLETED | ARCHIVED
  createdBy: UserId;
  towers: WorkTower[];
  documents: WorkDocument[];
}
```

### 5.2 Tower (Torre)
```ts
class Tower {
  id: TowerId;
  workId: WorkId;              // toda torre pertence a uma obra
  type: TowerType;
  extension: number;
  workingHeight: number;       // Hu
  deflectionAngle: Angle;      // { deg, min, sec, dir }
  classification: TowerClassification; // SELF_SUPPORTING | GUYED
  legs?: Leg[];                // somente autoportante
  guyedElements?: {
    centralMasts: TowerElement[]; // 1 ou 2 MC
    stays: TowerElement[];        // A, B, C, D
  };
}
```

### 5.3 Leg / TowerElement (Perna / Elemento)
```ts
class Leg {
  id: 'A' | 'B' | 'C' | 'D';
  foundationCatalogItemId: CatalogItemId;   // obrigatório — catálogo tipificado
  theoreticalData: LegTheoreticalData;      // dados de projeto
  fieldData?: LegFieldData;                 // dados de campo (opcional antes do campo)
  stub: Stub;
}

class LegTheoreticalData {
  naturalElevation: number;                 // Nc — projeto
  concreteCastingElevation: number;         // Ncc — projeto
}

class LegFieldData {
  naturalElevation: number;                 // Nc — medido em campo
  concreteCastingElevation: number;         // Ncc — medido em campo
  measuredAt: Date;
  measuredBy: UserId;
}
```

### 5.4 Foundation (Fundação)
```ts
abstract class Foundation {
  catalogItemId: CatalogItemId;            // referência obrigatória ao catálogo
  type: FoundationType;                    // TM | TBM | TE | TBE | TR | TB | S | BR | SM | SPM | VE | BST
  geometry: FoundationGeometry;            // readonly — vem do catálogo
  reinforcement?: Reinforcement;
  volumes: VolumesVO;
  depth: DepthVO;
}
```

### 5.5 Dados Teóricos vs Campo

O sistema mantém dois modelos de dados separados para cada perna/elemento:

| Aspecto | `theoreticalData` | `fieldData` |
|---------|-------------------|-------------|
| Origem | Documento de projeto | Medição em campo |
| Nc, Ncc | Valores de projeto | Valores reais medidos |
| Obrigatório para cálculo | Sim | Não (until campo disponível) |
| Entrada via pipeline | Ingestão de memória de cálculo | Ingestão de locação de campo |
| Validação humana | Obrigatória (spec 35) | Obrigatória (spec 35) |
| Usado para emissão | Sim (comparativo) | Sim (resultado final) |

Regra: o cálculo é executado com `theoreticalData` se `fieldData` não disponível. Quando `fieldData` está presente e aprovado, o cálculo é recalculado e comparado.

### 5.6 IngestionJob (Pipeline de ingestão)
```ts
class IngestionJob {
  id: IngestionJobId;
  workId: WorkId;
  documentType: DocumentType;
  status: JobStatus;           // UPLOADED → CLASSIFYING → ... → PENDING_REVIEW
  regions: DocumentRegion[];
  parsedRecords: ParsedRecord[];
}
```

### 5.7 ReviewItem (Validação humana)
```ts
class ReviewItem {
  id: ReviewItemId;
  jobId: IngestionJobId;
  entityType: 'TOWER' | 'LEG' | 'STAY' | 'FOUNDATION' | 'LOCATION';
  status: ReviewStatus;        // PENDING | IN_REVIEW | APPROVED | REJECTED
  fields: ReviewField[];
  decision?: ReviewDecision;
}
```

## 6. Inputs vs Outputs (Alto Nível)

| Input | Origem | Output (após motor de cálculo) |
|-------|--------|-------------------------------|
| Tipo de torre, extensão, Hu | Catálogo + projeto | Classificação (perna ou elemento) |
| Ângulo de deflexão | Projeto (teórico) | Bissetriz, ângulos por perna/estai |
| Nc por ponto (teórico) | Memória de cálculo (ingestão) | Afl, NFC, H |
| Nc por ponto (campo) | Locação de campo (ingestão) | Comparativo teórico vs campo |
| Tipo de fundação por perna | Catálogo (seleção) | Volumes tubulão (TM/TBM/TE/TBE/TR/TB) ou sapata V=LxBxH (S/BR/SM/SPM) |
| Geometria da fundação | Catálogo (readonly) | Locação S1..S4 (S/BR/SM/SPM) ou eixo (TM/TBM/TE/TBE/TR/TB/VE/BST) |

## 7. Regras de Negócio (Globais)

- **RN-001**: Torre autoportante tem exatamente 4 pernas (A, B, C, D).
- **RN-002**: Torre estaiada tem 1 ou 2 MC + exatamente 4 estais (A, B, C, D).
- **RN-003**: Cada perna/elemento referencia **uma** fundação do catálogo.
- **RN-004**: Tipos de fundação podem ser **diferentes entre pernas/elementos** da mesma torre.
- **RN-005**: A seleção de fundação por perna/elemento é obrigatória antes do cálculo.
- **RN-006**: Motor de cálculo só executa quando todos os inputs obrigatórios estão presentes.
- **RN-007**: Parâmetros ausentes bloqueiam a emissão final (somente rascunho permitido).
- **RN-008**: Toda torre pertence a exatamente uma obra (`Work`).
- **RN-009**: Dados teóricos e dados de campo são armazenados em modelos separados; nunca mesclados.
- **RN-010**: Nenhum dado extraído por IA persiste no domínio sem aprovação humana (`ReviewItem.APPROVED`).

## 8. Módulos / Serviços (Hexagonal)

### 8.1 Outbound Ports (em `application/ports/`)
- `WorkRepository`
- `TowerRepository`
- `FoundationCatalogRepository`
- `SurveyRepository`
- `FoundationCalculatorPort`
- `ReportExporterPort`
- `FileStoragePort`
- `RoboflowPort`
- `DocumentAiPort`
- `IngestionJobRepository`
- `ReviewItemRepository`
- `AuditLogPort`
- `UserRepository`

### 8.2 Inbound / Use Cases (em `application/use-cases/`)
- `CreateWorkUseCase`
- `UploadDocumentUseCase`
- `ProcessRoboflowUseCase`
- `ProcessOcrUseCase`
- `ParseExtractedDataUseCase`
- `ApproveReviewItemUseCase`
- `RejectReviewItemUseCase`
- `SelectFoundationForLegUseCase`
- `SelectFoundationForElementUseCase`
- `RunFoundationCalculationUseCase`
- `ExportReportUseCase`
- `ValidateDesignUseCase`
- `LoginUseCase`

### 8.3 Adapters (em `infrastructure/`)
- `PostgresWorkRepositoryAdapter`
- `PostgresTowerRepositoryAdapter`
- `PostgresFoundationCatalogRepositoryAdapter`
- `PostgresIngestionJobRepositoryAdapter`
- `PostgresReviewItemRepositoryAdapter`
- `PostgresAuditLogRepositoryAdapter` (append-only)
- `PostgresUserRepositoryAdapter`
- `RoboflowHttpAdapter`
- `GoogleDocumentAiAdapter`
- `S3FileStorageAdapter`
- `ExcelReportExporterAdapter`
- `PdfReportExporterAdapter`

### 8.4 Frontend (Angular v20+)
- Feature folders por contexto: `auth/`, `obra/`, `ingestion/`, `validation/`, `catalog/`, `foundation/`, `report/`.
- Standalone components, Signals, Control Flow.
- Interceptors: JWT injection, 401 refresh handler.
- Guards: `AuthGuard`, `RoleGuard`.

## 9. Critérios de Aceitação

- **CA-001**: Domínio representa autoportante (4 pernas) e estaiada (MC + 4 estais).
- **CA-002**: Tipos de fundação distintos por perna/elemento da mesma torre.
- **CA-003**: Linguagem ubíqua: código EN, UI/specs PT-BR, mapeamento em `05_ARCHITECTURE_AND_STACK.md §6.1`.
- **CA-004**: Bounded contexts não compartilham agregados; comunicação via eventos ou DTOs.
- **CA-005**: Cada Domain Service tem suíte de testes unitários TDD com casos de borda.
- **CA-006**: Cada Use Case tem suíte de testes com ports mockados.
- **CA-007**: `Work` é a raiz — toda torre e documento referencia um `workId` válido.
- **CA-008**: Modelos teórico (`theoreticalData`) e campo (`fieldData`) armazenados e consultáveis separadamente.
- **CA-009**: Nenhum `ParsedRecord` persiste sem `ReviewItem.status = APPROVED`.
- **CA-010**: Toda fundação referencia `CatalogItemId` — nenhum parâmetro de geometria livre aceito.

## 10. TODO / Pendências
- Lista oficial de tipos de torre (SL, SY, etc.): **unknown** — TODO confirmar.
- Política de versionamento do catálogo de fundações: **unknown** — TODO.
- Eventos de domínio cross-context (ex.: `ReviewItemApproved` → `FoundationDesign`): **unknown** — TODO definir mecanismo (in-process events vs message broker).
- Regra de separação de funções: revisor não pode ser o mesmo que fez o upload — **unknown** — TODO confirmar.
- Campos obrigatórios de `fieldData` por tipo de elemento: **unknown** — TODO confirmar com engenharia.
