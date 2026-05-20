# 05 — Arquitetura e Stack Tecnológico

## 1. Objetivo
Estabelecer o **stack tecnológico**, a **arquitetura de referência** (Clean Architecture + DDD + Hexagonal), a estratégia de **TDD** e as **convenções de codificação em inglês** a serem aplicadas em todo o projeto.

## 2. Escopo
**In scope**: stack, camadas, fronteiras, convenções de código, estratégia de testes, organização de monorepo, Docker.

**Out of scope**: regras de domínio (cobertas nas demais specs).

## 3. Stack Tecnológico

| Camada | Tecnologia | Versão | Observação |
|--------|------------|--------|-----------|
| Frontend | Angular | v20+ | Standalone components, Signals, Control Flow `@if/@for`. |
| Estilização | Tailwind CSS | v3+ | Utility-first; design tokens centralizados. |
| Backend | NestJS | última estável | Modular, decorators, DI nativo. |
| Linguagem | TypeScript | última estável | `strict: true` em todos os tsconfig. |
| Banco | PostgreSQL | v16+ | Migrations versionadas. |
| ORM | TypeORM ou Prisma | última | **unknown** — TODO escolher (recomendação: Prisma pelo type-safety; ambos compatíveis com Hexagonal via Repository Port). |
| Containerização | Docker + Docker Compose | última | Serviços: `frontend`, `backend`, `postgres`, `adminer` (opcional). |
| Testes BE | Jest + Supertest | última | Unit + integration. |
| Testes FE | Jest/Karma + Cypress/Playwright | última | Unit + e2e. **unknown** — TODO escolher framework e2e. |
| Lint/Format | ESLint + Prettier | última | Regras padronizadas; pre-commit via Husky. |
| CI | GitHub Actions | — | Build, lint, test, coverage. |

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
- **Outbound Ports**: interfaces que a Application/Domain exigem da Infrastructure (ex.: `TowerRepository`, `FoundationCatalogRepository`).
- **Adapters**:
  - Inbound: `TowerController` (REST), CLI tasks, schedulers.
  - Outbound: `PostgresTowerRepositoryAdapter`, `ExcelSpreadsheetExporterAdapter`, `PdfExporterAdapter`.

### 4.3 DDD
- Linguagem ubíqua em **inglês no código** (ver §6) e PT-BR nas specs.
- Bounded contexts: `tower-catalog`, `foundation-design`, `survey`, `spreadsheet-emission`.
- Cada contexto tem seu próprio módulo NestJS e suas próprias entidades; comunicação via eventos ou DTOs.

### 4.4 TDD
- Ciclo Red → Green → Refactor.
- Cobertura mínima alvo: 80% no Domain e Application; 70% no total. (Tolerância: **unknown** — TODO confirmar.)
- Pirâmide:
  - **Unit** (maioria): Domain entities, value objects, domain services, calculators.
  - **Integration**: use cases com adapters reais (Postgres via Testcontainers).
  - **E2E**: fluxos completos frontend ↔ backend.

## 5. Organização do Repositório (Monorepo Recomendado)

```
lt_foundation/
├── apps/
│   ├── api/               # NestJS app
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── tower-catalog/
│   │   │   │   ├── foundation-design/
│   │   │   │   ├── survey/
│   │   │   │   └── spreadsheet-emission/
│   │   │   └── main.ts
│   │   └── test/
│   └── web/               # Angular v20+ app
│       ├── src/
│       │   ├── app/
│       │   │   ├── features/
│       │   │   │   ├── tower/
│       │   │   │   ├── foundation/
│       │   │   │   └── spreadsheet/
│       │   │   └── shared/
│       │   └── main.ts
│       └── tailwind.config.ts
├── libs/                  # Pacotes compartilhados (opcional)
│   ├── domain/            # Entidades/VOs compartilhados (puros)
│   ├── shared-dtos/       # DTOs cross-app
│   └── ui-kit/            # Componentes Angular reutilizáveis
├── docker/
│   ├── docker-compose.yml
│   ├── Dockerfile.api
│   └── Dockerfile.web
├── Docs/.specs/
└── package.json
```

> Ferramenta de monorepo: **Nx** ou **Turborepo**. Recomendação: **Nx** (suporte nativo a NestJS + Angular). **unknown** — TODO confirmar.

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
| Tubulão | `CaissonFoundation` (kind: `CAISSON`) |
| Sapata | `FootingFoundation` (kind: `FOOTING`) |
| Afloramento | `protrusion` (ou `aboveGround`) |
| Ângulo de deflexão | `deflectionAngle` |
| Bissetriz | `bisector` |
| Cota natural (Nc) | `naturalElevation` |
| Cota de concretagem (Ncc) | `concreteCastingElevation` |
| Profundidade | `depth` |
| Nível de fundo de concretagem (NFC) | `concreteBottomLevel` |
| Volume total | `totalVolume` |
| Volume de escavação | `excavationVolume` |
| Stub | `stub` |
| Banco de fundações | `foundationCatalog` |
| Locação | `location` / `layout` |
| Cantos S1..S4 | `corners.s1..s4` |

> Aplicar `camelCase` para variáveis/funções, `PascalCase` para classes/tipos, `UPPER_SNAKE` para enums/constantes.

### 6.2 Estilo
- ESLint + Prettier.
- Nomes verbais para use cases: `RunFoundationCalculationUseCase`, `SelectFoundationForLegUseCase`, `EmitSpreadsheetUseCase`.
- Ports terminam com sufixo `Port` ou `Repository`.
- Adapters terminam com sufixo `Adapter`.
- DTOs terminam com sufixo `Dto`.
- Testes: `*.spec.ts` (unit), `*.int-spec.ts` (integration), `*.e2e-spec.ts` (e2e).

## 7. Estratégia TDD

### 7.1 Ordem de Implementação por Feature
1. Escrever **teste de domínio** (ex.: `CaissonVolumeCalculator.spec.ts` — falha).
2. Implementar a regra mínima para passar.
3. Refactor.
4. Escrever **teste de use case** (`RunFoundationCalculationUseCase.spec.ts`).
5. Implementar com **mocks dos ports**.
6. Escrever **teste de integração** com adapter real (Postgres via Testcontainers).
7. Escrever **e2e** do fluxo HTTP no frontend.

### 7.2 Test Doubles
- Mocks/stubs gerados via `jest.mock` ou bibliotecas como `@golevelup/ts-jest`.
- **Não** mockar entidades de domínio; testar de forma direta.
- Mockar **ports**, não classes concretas.

### 7.3 Critérios de Aceitação Globais (TDD)
- **CA-051**: Cada use case tem suíte de unit tests cobrindo caminhos felizes e de exceção.
- **CA-052**: Cada Domain Service tem unit tests com casos de borda (zero, negativo, máximo).
- **CA-053**: Repositórios têm integration tests com Postgres real (Docker/Testcontainers).
- **CA-054**: Pipeline CI executa: lint → unit → integration → e2e → coverage gate.

## 8. Docker / Docker Compose

### 8.1 Serviços
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

  api:
    build: { context: ., dockerfile: docker/Dockerfile.api }
    environment:
      DATABASE_URL: postgres://lt:lt@postgres:5432/lt_foundation
      NODE_ENV: development
    ports: ["3000:3000"]
    depends_on: [postgres]

  web:
    build: { context: ., dockerfile: docker/Dockerfile.web }
    environment:
      API_URL: http://api:3000
    ports: ["4200:80"]
    depends_on: [api]

volumes:
  pgdata:
```

### 8.2 Ambientes
- `dev`: hot reload (Vite/Nest watch), Postgres exposto em 5432.
- `test`: banco efêmero via Testcontainers.
- `prod`: imagens multi-stage minificadas; HTTPS por reverse proxy externo.

## 9. PostgreSQL — Diretrizes

- Schema por bounded context (ex.: `tower_catalog`, `foundation_design`) — alternativa: prefixo de tabela.
- Migrations versionadas (Prisma Migrate ou TypeORM Migrations).
- Tipos numéricos: `NUMERIC(p,s)` para grandezas físicas (evitar `FLOAT`).
- Constraints declarativos: `CHECK (l > 0)`, `CHECK (b > 0)`, etc.
- Soft-delete opcional via `deleted_at`. **unknown** — TODO confirmar.

## 10. Frontend — Diretrizes

- Angular **standalone components** (sem `NgModule` raiz tradicional).
- **Signals** para estado local e reativo.
- **Control Flow** moderno (`@if`, `@for`, `@switch`).
- Stores leves via Signals (ou NgRx Signal Store se complexidade exigir).
- Tailwind: design tokens (cores, espaçamentos) em `tailwind.config.ts`.
- Acessibilidade (WCAG 2.1 AA) como requisito.
- i18n PT-BR primário; estrutura pronta para EN/ES futuramente. **unknown** — TODO confirmar.

## 11. Backend — Diretrizes (NestJS)

- Módulos por bounded context (`TowerCatalogModule`, `FoundationDesignModule`, etc.).
- Controllers finos: somente HTTP → DTO → UseCase.
- Use Cases (Application) **não** dependem do NestJS — TypeScript puro com classes injetáveis registradas no módulo.
- Validation via `class-validator` nos DTOs.
- Logging estruturado (pino). **unknown** — TODO confirmar.
- OpenAPI/Swagger gerado a partir de DTOs decorados.

## 12. Critérios de Aceitação

- **CA-501**: Repositório monorepo com `apps/api`, `apps/web`, `docker/` e `Docs/.specs/`.
- **CA-502**: `docker compose up` sobe `postgres`, `api`, `web` funcionais.
- **CA-503**: Estrutura de pastas do backend reflete Clean Architecture (`domain/`, `application/`, `infrastructure/`, `presentation/`) por módulo.
- **CA-504**: Frontend Angular v20+ usa standalone components, Signals e Control Flow.
- **CA-505**: Pipeline CI roda lint, unit, integration, e2e em cada PR.
- **CA-506**: Cobertura de testes ≥ 80% no Domain/Application.
- **CA-507**: Linguagem ubíqua no código está em inglês conforme §6.1.

## 13. TODO / Pendências
- ORM definitivo (Prisma vs TypeORM): **unknown** — TODO.
- Ferramenta de monorepo (Nx vs Turborepo): **unknown** — TODO.
- Framework de e2e (Cypress vs Playwright): **unknown** — TODO.
- Limites exatos de cobertura: **unknown** — TODO.
- Reverse proxy / TLS em produção: **unknown** — TODO.
- Política i18n: **unknown** — TODO.
