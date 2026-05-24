# 05 — Arquitetura e Stack Tecnológico

## 1. Objetivo
Estabelecer o **stack tecnológico**, a **arquitetura de referência** (Clean Architecture + DDD + Hexagonal), a **arquitetura híbrida de IA** (Roboflow + OCR/Document AI), a estratégia de **TDD** e as **convenções de codificação** a serem aplicadas em todo o projeto.

## 2. Escopo
**In scope**: stack, camadas, fronteiras, pipeline de IA, integrações externas, convenções de código, estratégia de testes, organização de monorepo, Docker.

**Out of scope**: regras de domínio de fundações (cobertas nas demais specs).

## 3. Stack Tecnológico

| Camada | Tecnologia | Versão | Observação |
|--------|------------|--------|-----------|
| Frontend | Angular | v20+ | Standalone components, Signals, Control Flow `@if/@for`. |
| Estilização | Tailwind CSS | v3+ | Utility-first; design tokens centralizados. |
| Backend | NestJS | última estável | Modular, decorators, DI nativo. |
| Linguagem | TypeScript | última estável | `strict: true` em todos os tsconfig. |
| Banco | PostgreSQL | v16+ | Migrations versionadas. |
| ORM | Prisma | última | Type-safety nativo; Prisma Migrate para migrations. |
| Containerização | Docker + Docker Compose | última | Serviços: `api`, `web`, `postgres`. |
| Testes BE | Jest + Testcontainers | última | Unit + integration com Postgres real. |
| Testes E2E | Playwright | última | Fluxos frontend ↔ backend. |
| Lint/Format | ESLint + Prettier | última | Pre-commit via Husky. |
| CI | GitHub Actions | — | Build, lint, test, coverage. |
| Armazenamento de arquivos | S3-compatible (local: MinIO) | — | Upload de documentos PDF/Excel. |
| IA — Detecção de layout | Roboflow | API v1 | Configurado por `documentType` via ENV. |
| IA — Extração de texto | Google Document AI | v1 | Processamento de regiões detectadas. |
| Logging | Pino | última | Logging estruturado JSON. |
| API Docs | Swagger / OpenAPI | — | Gerado a partir de DTOs decorados. |

## 4. Princípios Arquiteturais

### 4.1 Clean Architecture (Camadas Concêntricas)
1. **Domain** (núcleo): entidades, agregados, value objects, domain services, eventos, regras de negócio. Zero dependências externas.
2. **Application**: use cases (interactors), orquestração, ports (interfaces) que o Domain e a Application precisam.
3. **Infrastructure**: adapters (DB, HTTP clients, filesystem, libraries). Implementa ports declarados nas camadas internas.
4. **Presentation**:
   - Backend: controllers NestJS (HTTP/REST), DTOs de entrada/saída, mapeadores.
   - Frontend: componentes Angular, serviços de UI, stores.

### 4.2 Hexagonal (Ports & Adapters)
- **Inbound Ports**: interfaces dos use cases consumidas pelo Presentation (ex.: `RunFoundationCalculationUseCase`).
- **Outbound Ports**: interfaces que a Application/Domain exigem da Infrastructure (ex.: `TowerRepository`, `RoboflowPort`, `DocumentAiPort`).
- **Adapters**:
  - Inbound: `TowerController`, `IngestionController`, `ValidationController` (REST).
  - Outbound: `PostgresTowerRepositoryAdapter`, `RoboflowHttpAdapter`, `GoogleDocumentAiAdapter`, `S3FileStorageAdapter`, `ExcelSpreadsheetExporterAdapter`.

### 4.3 DDD
- Linguagem ubíqua em **inglês no código** (ver §6) e PT-BR nas specs.
- Bounded contexts (cada um vira um módulo NestJS):

| Context | Módulo | Agregado raiz |
|---------|--------|--------------|
| `auth` | `AuthModule` | `User` |
| `obra` | `ObraModule` | `Work` |
| `tower-catalog` | `TowerModule` | `Tower` |
| `document-ingestion` | `IngestionModule` | `IngestionJob` |
| `human-validation` | `ValidationModule` | `ReviewItem` |
| `foundation-catalog` | `CatalogModule` | `FoundationCatalogItem` |
| `foundation-design` | `FoundationModule` | `FoundationDesign` |
| `survey` | `SurveyModule` | `LocationSurvey` |
| `spreadsheet-emission` | `EmissionModule` | `Spreadsheet` |

### 4.4 Pipeline Híbrido de IA (Arquitetura)

O pipeline de ingestão de documentos é **assíncrono** e orquestrado por jobs:

```
┌─────────────┐     ┌──────────────────┐     ┌──────────────────────┐
│  Presentation│────▶│  Application     │────▶│  Infrastructure      │
│  (Upload API)│     │  (Use Cases)     │     │  (Adapters)          │
└─────────────┘     └──────────────────┘     └──────────────────────┘
                           │                           │
                    UploadDocumentUseCase        FileStorageAdapter
                    ClassifyDocumentUseCase      (S3 / MinIO)
                    ProcessRoboflowUseCase       │
                    ProcessOcrUseCase            ▼
                    ParseExtractedDataUseCase    RoboflowHttpAdapter
                                                 (POST /detect)
                                                 │
                                                 ▼
                                                 GoogleDocumentAiAdapter
                                                 (processar regiões)
                                                 │
                                                 ▼
                                                 ExcelColumnMapperAdapter
                                                 (para XLSX batch)
```

**Separação de responsabilidades obrigatória**:
- **Roboflow**: detecta regiões e layout — retorna bounding boxes + labels. Não interpreta conteúdo.
- **OCR / Document AI**: extrai texto de cada região detectada. Não sabe nada sobre domínio de fundações.
- **Parser interno**: transforma campos brutos do OCR em JSON estruturado conforme entidades do domínio. Não chama APIs externas.
- **Sistema interno**: valida, persiste e calcula. Nunca chama diretamente Roboflow ou OCR — somente via ports.

**Regra de desacoplamento**: o domínio (`domain/`) nunca conhece Roboflow, OCR, Document AI ou qualquer serviço externo. Todas as integrações ficam em `infrastructure/adapters/`.

### 4.5 TDD
- Ciclo Red → Green → Refactor.
- Cobertura mínima alvo: 80% no Domain e Application; 70% no total.
- Pirâmide:
  - **Unit** (maioria): Domain entities, value objects, domain services, calculators, parsers.
  - **Integration**: use cases com adapters reais (Postgres via Testcontainers).
  - **E2E**: fluxos completos frontend ↔ backend (Playwright).

## 5. Organização do Repositório (Monorepo — Nx)

```
lt_foundation/
├── apps/
│   ├── api/                          # NestJS app
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/
│   │   │   │   ├── obra/
│   │   │   │   ├── tower-catalog/
│   │   │   │   ├── document-ingestion/
│   │   │   │   ├── human-validation/
│   │   │   │   ├── foundation-catalog/
│   │   │   │   ├── foundation-design/
│   │   │   │   ├── survey/
│   │   │   │   └── spreadsheet-emission/
│   │   │   └── main.ts
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   └── test/
│   └── web/                          # Angular v20+ app
│       ├── src/
│       │   ├── app/
│       │   │   ├── features/
│       │   │   │   ├── auth/
│       │   │   │   ├── obra/
│       │   │   │   ├── tower/
│       │   │   │   ├── ingestion/
│       │   │   │   ├── validation/
│       │   │   │   ├── catalog/
│       │   │   │   ├── foundation/
│       │   │   │   └── spreadsheet/
│       │   │   └── shared/
│       │   └── main.ts
│       └── tailwind.config.ts
├── libs/
│   ├── domain/                       # Entidades/VOs compartilhados (puros)
│   ├── shared-dtos/                  # DTOs cross-app
│   └── ui-kit/                       # Componentes Angular reutilizáveis
├── docker/
│   ├── docker-compose.yml
│   ├── Dockerfile.api
│   └── Dockerfile.web
├── Docs/.specs/
└── package.json
```

### Estrutura interna de cada módulo (Clean Architecture)
```
modules/<context>/
├── domain/
│   ├── entities/
│   ├── value-objects/
│   └── services/
├── application/
│   ├── ports/
│   └── use-cases/
├── infrastructure/
│   ├── adapters/        # Prisma, HTTP clients, file storage
│   └── mappers/
└── presentation/
    ├── controllers/
    ├── dtos/
    └── mappers/
```

## 6. Convenções de Codificação (Inglês)

### 6.1 Mapeamento PT-BR → Inglês (Linguagem Ubíqua no Código)

| PT-BR (specs/UI) | EN (código) |
|------------------|-------------|
| Torre | `Tower` |
| Torre Autoportante | `SelfSupportingTower` |
| Torre Estaiada | `GuyedTower` |
| Perna (A/B/C/D) | `Leg` |
| Mastro Central | `CentralMast` |
| Estai | `Stay` |
| Elemento (estaiada) | `TowerElement` |
| Fundação | `Foundation` |
| Tubulão Mercado | `CaissonFoundation` (type: `TM`) |
| Tubulão Estacado | `CaissonFoundation` (type: `TE`) |
| Tubulão Reta | `CaissonFoundation` (type: `TR`) |
| Sapata | `FootingFoundation` (type: `S`) |
| Sapata com Monólito | `FootingFoundation` (type: `SM`) |
| Viga Engastada | `EmbeddedBeamFoundation` (type: `VE`) |
| Afloramento | `protrusion` |
| Ângulo de deflexão | `deflectionAngle` |
| Bissetriz | `bisector` |
| Cota natural (Nc) | `naturalElevation` |
| Cota de concretagem (Ncc) | `concreteCastingElevation` |
| Profundidade | `depth` |
| NFC | `concreteBottomLevel` |
| Volume total | `totalVolume` |
| Volume de escavação | `excavationVolume` |
| Stub | `stub` |
| Catálogo de fundações | `foundationCatalog` |
| Locação | `location` / `layout` |
| Cantos S1..S4 | `corners.s1..s4` |
| Obra | `Work` |
| Torre da Obra | `WorkTower` |
| Job de ingestão | `IngestionJob` |
| Item de revisão | `ReviewItem` |
| Campo extraído | `ExtractedField` |
| Dado teórico | `theoreticalData` |
| Dado de campo | `fieldData` |
| Usuário | `User` |
| Perfil | `UserRole` |

> Aplicar `camelCase` para variáveis/funções, `PascalCase` para classes/tipos, `UPPER_SNAKE` para enums/constantes.

### 6.2 Estilo
- ESLint + Prettier.
- Nomes verbais para use cases: `RunFoundationCalculationUseCase`, `UploadDocumentUseCase`, `ApproveReviewItemUseCase`.
- Ports terminam com sufixo `Port` ou `Repository`.
- Adapters terminam com sufixo `Adapter`.
- DTOs terminam com sufixo `Dto`.
- Testes: `*.spec.ts` (unit), `*.int-spec.ts` (integration), `*.e2e-spec.ts` (e2e).

## 7. Estratégia TDD

### 7.1 Ordem de Implementação por Feature
1. Escrever **teste de domínio** (ex.: `CaissonVolumeCalculator.spec.ts` — falha).
2. Implementar a regra mínima para passar.
3. Refactor.
4. Escrever **teste de use case** (ex.: `UploadDocumentUseCase.spec.ts`) com mocks dos ports.
5. Implementar com **mocks dos ports**.
6. Escrever **teste de integração** com adapter real (Postgres via Testcontainers).
7. Escrever **E2E** do fluxo HTTP no frontend (Playwright).

### 7.2 Test Doubles
- Mocks/stubs via `jest.mock` ou `@golevelup/ts-jest`.
- **Não** mockar entidades de domínio; testar diretamente.
- Mockar **ports**, não classes concretas.
- Adapters externos (Roboflow, Document AI) sempre mockados em testes unit/integration — usar Testcontainers apenas para Postgres.

### 7.3 Critérios de Aceitação Globais (TDD)
- **CA-051**: Cada use case tem suíte de unit tests cobrindo caminhos felizes e de exceção.
- **CA-052**: Cada Domain Service tem unit tests com casos de borda (zero, negativo, máximo).
- **CA-053**: Repositórios têm integration tests com Postgres real (Testcontainers).
- **CA-054**: Pipeline CI executa: lint → unit → integration → e2e → coverage gate.

## 8. Docker / Docker Compose

```yaml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_USER: lt
      POSTGRES_PASSWORD: lt
      POSTGRES_DB: lt_foundation
    ports: ["5432:5432"]
    volumes: ["pgdata:/var/lib/postgresql/data"]

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ltminio
      MINIO_ROOT_PASSWORD: ltminio123
    ports: ["9000:9000", "9001:9001"]
    volumes: ["miniodata:/data"]

  api:
    build: { context: ., dockerfile: docker/Dockerfile.api }
    environment:
      DATABASE_URL: postgres://lt:lt@postgres:5432/lt_foundation
      NODE_ENV: development
      STORAGE_ENDPOINT: http://minio:9000
      ROBOFLOW_WORKSPACE: ${ROBOFLOW_WORKSPACE}
      ROBOFLOW_API_KEY: ${ROBOFLOW_API_KEY}
      DOCUMENT_AI_PROJECT: ${DOCUMENT_AI_PROJECT}
      JWT_SECRET: ${JWT_SECRET}
    ports: ["3000:3000"]
    depends_on: [postgres, minio]

  web:
    build: { context: ., dockerfile: docker/Dockerfile.web }
    environment:
      API_URL: http://api:3000
    ports: ["4200:80"]
    depends_on: [api]

volumes:
  pgdata:
  miniodata:
```

### Ambientes
- `dev`: hot reload (Nest watch), Postgres + MinIO expostos.
- `test`: banco efêmero via Testcontainers; adapters externos mockados.
- `prod`: imagens multi-stage minificadas; HTTPS por reverse proxy externo; storage S3 real.

## 9. PostgreSQL — Diretrizes

- Schema por bounded context (ex.: `auth`, `obra`, `ingestion`).
- Migrations versionadas via Prisma Migrate.
- Tipos numéricos: `NUMERIC(p,s)` para grandezas físicas (evitar `FLOAT`).
- Constraints declarativos: `CHECK (l > 0)`, `CHECK (b > 0)`.
- Tabelas de auditoria (`system_audit_log`, `review_audit_entry`): append-only, sem UPDATE/DELETE.
- Soft-delete via `deleted_at` onde aplicável (obras, torres). **unknown** — TODO confirmar.

## 10. Integrações Externas

### Roboflow
- **Responsabilidade**: detecção de regiões e layout em documentos PDF.
- **API**: POST para endpoint de inferência do workspace/model configurado.
- **Configuração por `documentType`** (via ENV):

| documentType | ENV var de model |
|---|---|
| `CALC_MEMORY` | `ROBOFLOW_MODEL_CALC_MEMORY` |
| `LOCATION_SURVEY` | `ROBOFLOW_MODEL_LOCATION_SURVEY` |
| `FOUNDATION_PLAN` | `ROBOFLOW_MODEL_FOUNDATION_PLAN` |

- Workspace comum: `ROBOFLOW_WORKSPACE`.
- API Key: `ROBOFLOW_API_KEY`.
- Adapter: `RoboflowHttpAdapter` implements `RoboflowPort`.

### Google Document AI (OCR)
- **Responsabilidade**: extração de texto de regiões bounding-box identificadas pelo Roboflow.
- **API**: Document AI `batchProcessDocuments` ou `processDocument`.
- **Configuração**: `DOCUMENT_AI_PROJECT`, `DOCUMENT_AI_LOCATION`, `DOCUMENT_AI_PROCESSOR_ID`.
- Adapter: `GoogleDocumentAiAdapter` implements `DocumentAiPort`.

### Storage de Arquivos
- **Dev/test**: MinIO (S3-compatible local).
- **Prod**: AWS S3 ou equivalente.
- Adapter: `S3FileStorageAdapter` implements `FileStoragePort`.

> **Regra de isolamento**: nenhum adapter externo é importado diretamente por use cases ou entidades de domínio. Todos passam pelos ports declarados em `application/ports/`.

## 11. Frontend — Diretrizes (Angular v20+)

- **Standalone components** (sem `NgModule` raiz tradicional).
- **Signals** para estado local e reativo; `computed()` para derivações.
- **Control Flow** moderno (`@if`, `@for`, `@switch`).
- Stores leves via Signals; NgRx Signal Store se complexidade exigir.
- Tailwind: design tokens (cores, espaçamentos) em `tailwind.config.ts`.
- Interceptors HTTP: injeção de `Authorization` header + refresh automático em 401.
- Acessibilidade: WCAG 2.1 AA como requisito.
- `@defer` para componentes pesados (PDF viewer, gráficos SVG).

## 12. Backend — Diretrizes (NestJS)

- Módulos por bounded context (`AuthModule`, `ObraModule`, `IngestionModule`, etc.).
- Controllers finos: somente HTTP → DTO → UseCase.
- Use Cases **não** dependem do NestJS — TypeScript puro registrado via DI.
- Validation via `class-validator` nos DTOs de entrada.
- Logging estruturado com Pino (`nestjs-pino`).
- OpenAPI/Swagger gerado a partir de DTOs decorados com `@ApiProperty`.
- Guards globais: `JwtAuthGuard` (todas as rotas exceto `/auth/*`), `RolesGuard` por endpoint.

## 13. Critérios de Aceitação

- **CA-501**: Repositório monorepo com `apps/api`, `apps/web`, `docker/` e `Docs/.specs/`.
- **CA-502**: `docker compose up` sobe `postgres`, `minio`, `api`, `web` funcionais.
- **CA-503**: Estrutura de pastas do backend reflete Clean Architecture por módulo.
- **CA-504**: Frontend Angular v20+ usa standalone components, Signals e Control Flow.
- **CA-505**: Pipeline CI roda lint, unit, integration, e2e em cada PR.
- **CA-506**: Cobertura de testes ≥ 80% no Domain/Application.
- **CA-507**: Linguagem ubíqua no código está em inglês conforme §6.1.
- **CA-508**: Adaptadores de Roboflow e Document AI implementam ports — domínio não conhece APIs externas.
- **CA-509**: Variáveis de ambiente externas (Roboflow, Document AI, JWT) nunca hardcoded no código.
- **CA-510**: Tabelas de auditoria são append-only (sem DELETE/UPDATE).

## 14. TODO / Pendências
- Ferramenta de monorepo: **Nx** — confirmar com equipe.
- Limites exatos de cobertura de testes: **unknown** — TODO.
- Reverse proxy / TLS em produção: **unknown** — TODO.
- Política i18n (EN/ES além de PT-BR): **unknown** — TODO.
- Provider OCR definitivo (Google Document AI vs AWS Textract vs Azure Form Recognizer): **unknown** — TODO.
- Modelos Roboflow definitivos por `documentType`: **unknown** — TODO treinamento.
- Política de soft-delete por entidade: **unknown** — TODO.
