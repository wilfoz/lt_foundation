# 00 — Índice de Especificações — Sistema de Fundações de Torres (LT)

## 1. Padrão de Documentação

### 1.1 Convenção de Nomes
- Arquivos prefixados por número de duas posições (`NN_NOME.md`) indicando ordem de leitura.
- Substantivos em PT-BR, MAIÚSCULAS para domínios principais.
- Termos de domínio em PT-BR; termos técnicos de arquitetura podem permanecer em EN (Hexagonal, Adapter, Port).

### 1.2 Template Obrigatório de Seções
Toda spec deve conter, na ordem:
1. **Objetivo**
2. **Escopo** (in/out of scope)
3. **Glossário** (somente termos específicos da spec)
4. **Entidades de Domínio (DDD)**
5. **Inputs vs Outputs** (tabela)
6. **Regras de Negócio** (numeradas `RN-XXX`)
7. **Validações** (tabela com `V-XXX`)
8. **Cálculos** (fórmulas + explicações curtas)
9. **Fluxos** (passo a passo)
10. **UI/UX — Requisitos** (sem desenhar telas)
11. **Módulos/Serviços (Hexagonal)** — Ports & Adapters
12. **Critérios de Aceitação** (`CA-XXX`)
13. **TODO / Pendências** (itens marcados como `unknown`)

### 1.3 Estilo de Escrita
- Frases curtas, voz ativa, imperativo onde fizer sentido.
- Sem emojis.
- Tabelas para qualquer enumeração com >3 itens estruturados.
- Fórmulas em bloco de código quando matemáticas; usar notação `Var = expressão`.
- Identificadores estáveis: `RN-###`, `V-###`, `CA-###`, `EP-###` (endpoint).

### 1.4 Marcação de Lacunas
- Qualquer parâmetro não confirmado deve ser marcado explicitamente como `unknown` e listado na seção **TODO / Pendências** do arquivo correspondente.

---

## 2. Mapa de Specs

| # | Arquivo | Conteúdo | Status |
|---|---------|----------|--------|
| 00 | `00_INDEX.md` | Este índice, padrão, mapa e premissas globais. | ✅ |
| 05 | `05_ARCHITECTURE_AND_STACK.md` | Stack, Clean Architecture, Hexagonal, pipeline híbrido de IA, TDD, convenções. | ✅ |
| 10 | `10_DOMAIN_OVERVIEW.md` | DDD, bounded contexts, agregados, modelos teórico vs campo. | ✅ |
| 15 | `15_OBRA.md` | Gestão de Obra — agregado raiz do sistema. | ✅ |
| 20 | `20_AUTOPORTANTES.md` | Torres autoportantes, fundações por perna (A/B/C/D). | ✅ |
| 25 | `25_DOCUMENT_INGESTION.md` | Pipeline: Upload → Roboflow → OCR/Document AI → Parser → Fila. | ✅ |
| 30 | `30_ESTAIADAS.md` | Torres estaiadas, Mastro Central + Estais (A/B/C/D). | ✅ |
| 35 | `35_VALIDATION_HUMANA.md` | Validação humana obrigatória de dados extraídos. | ✅ |
| 40 | `40_FUNDACOES_TUBULAO.md` | Fundações tubulão: TM (Mercado), TE (Estacado), TR (Reta). | ✅ |
| 41 | `41_FUNDACOES_SAPATA.md` | Fundações sapata: S (Simples) e SM (com Monólito/Pedestal). | ✅ |
| 42 | `42_FUNDACOES_VIGA.md` | Fundação Viga Engastada (VE) — exclusivo para estais. | 📋 TODO |
| 45 | `45_AUTH.md` | Autenticação, perfis de acesso (RBAC), rastreabilidade. | ✅ |
| 50 | `50_VALIDACOES_E_ALERTAS.md` | Catálogo global de validações e alertas (V-001..V-017+). | ✅ |
| 55 | `55_CATALOGO_FUNDACOES.md` | Catálogo tipificado TM/TE/TR/S/SM/VE — seleção e versionamento. | ✅ |
| 60 | `60_CALCULOS_E_FORMULARIOS.md` | Motor de cálculo: fórmulas, ângulos, locação, volumes. | ✅ |
| 70 | `70_API_CONTRATOS.md` | Contratos REST/NestJS — DTOs e endpoints. | ✅ |

---

## 3. Decisões Arquiteturais Globais

- **Estilo**: DDD + Clean Architecture + Arquitetura Hexagonal (Ports & Adapters). Ver `05_ARCHITECTURE_AND_STACK.md`.
- **Stack**: Angular v20+ (Tailwind CSS v3+), NestJS, PostgreSQL 16, Docker Compose, TypeScript.
- **ORM**: Prisma (escolhido — type-safety, migrations versionadas). Ver `05_ARCHITECTURE_AND_STACK.md §3`.
- **Metodologia de Testes**: TDD (Red → Green → Refactor); pirâmide Unit / Integration (Testcontainers) / E2E (Playwright).
- **Linguagem do Código**: **inglês** (classes, métodos, variáveis, tabelas). Specs e UI em PT-BR.
- **Linguagem ubíqua**: glossários PT-BR em cada spec; mapeamento PT-BR → EN no `05_ARCHITECTURE_AND_STACK.md §6`.
- **Persistência**: PostgreSQL via Repository Ports; adapter implementado com Prisma.

### Bounded Contexts

| Context | Módulo NestJS | Responsabilidade principal |
|---------|--------------|---------------------------|
| `auth` | `AuthModule` | Login, JWT, perfis RBAC, `SystemAuditLog` |
| `obra` | `ObraModule` | **Raiz do sistema** — obras, torres, documentos, locações |
| `tower-catalog` | `TowerModule` | Tipos de torre, extensão, classificação elétrica |
| `document-ingestion` | `IngestionModule` | Upload PDF/Excel, Roboflow, OCR/Document AI, parser, jobs |
| `human-validation` | `ValidationModule` | Fila de revisão, edição, aprovação, auditoria de campos |
| `foundation-catalog` | `CatalogModule` | Catálogo tipificado TM/TE/TR/S/SM/VE |
| `foundation-design` | `FoundationModule` | Cálculo de fundações (autoportante e estaiada) |
| `survey` | `SurveyModule` | Cotas de campo (Nc, Ncc), locação topográfica |
| `report-emission` | `ReportModule` | Página web de inputs/cálculos/validações + exportação XLSX/PDF sob demanda |

---

## 4. Pipeline Híbrido de Ingestão (Visão Geral)

```
Upload (PDF / Excel)
  │
  ▼
Classificação automática de documento
(hint pelo nome do arquivo TypeCode+SheetType; confirmado por modelo de classificação)
documentType:
  FOUNDATION_PLAN  — FD-Ax: prancha de fundação (→ foundation-catalog)
  HEIGHT_FORMATION — ES-A1: Formação de Alturas e Locações (→ tower-catalog)
  STUB_DRAWING     — ES-A0: prancha de stub (→ tower-catalog) [sem text layer — OCR total]
  CALC_MEMORY      — memória de cálculo, dados teóricos (→ foundation-design)
  FIELD_SURVEY     — levantamento de campo, dados reais (→ survey)
  EXCEL_BATCH      — planilha batch (bypass Roboflow/OCR)
  UNKNOWN          — bloqueado até classificação manual
  │
  ▼
Roboflow — Detecção de regiões / layout
(workspaceId + modelId configuráveis por documentType via ENV)
  │
  ▼
OCR — Extração de texto por região detectada
(STUB_DRAWING: OCR no documento inteiro pois não há camada de texto vetorial)
(demais tipos: combinar text layer + OCR nas regiões rasterizadas)
  │
  ▼
Parser interno — Transformação em JSON estruturado
(FOUNDATION_PLAN gera 1 ParsedRecord por linha da tabela de dimensões)
(HEIGHT_FORMATION gera 1 ParsedRecord com variantes e tabela de locação)
(STUB_DRAWING gera 1 ParsedRecord com variantes de stub)
  │
  ▼
Fila de Validação Humana (ReviewQueue)
(campos com confidence < 0.6 marcados NEEDS_REVIEW e destacados na UI)
  │
  ▼ aprovado pelo revisor humano
Persistência no domínio (bounded context de destino por documentType)
(FOUNDATION_PLAN → FoundationCatalogItem | HEIGHT_FORMATION → TowerHeightSpec)
(STUB_DRAWING → StubSpec | CALC_MEMORY → LegTheoreticalData | FIELD_SURVEY → LocationSurvey)
  │
  ▼
Motor de Cálculo
```

> **Regra absoluta — RN-207**: nenhum dado extraído automaticamente persiste no domínio sem aprovação humana.

Responsabilidades por componente:

| Componente | Responsabilidade |
|-----------|-----------------|
| **Roboflow** | Detecção de regiões e layout (bounding boxes + labels) |
| **OCR / Document AI** | Extração de texto de regiões detectadas |
| **Parser interno** | Transformação de campos brutos em JSON estruturado |
| **Sistema interno** | Validação + persistência + cálculo |

---

## 5. Premissas Globais

### Torres
- **Autoportante**: exatamente 4 pernas (A, B, C, D) — `RN-001`.
- **Estaiada**:  1 ou 2 MC + exatamente 4 estais (A, B, C, D) — `RN-002`.
- Mistura de tipos de fundação permitida na mesma torre — `RN-004`.
- Seleção de fundação **obrigatória** por perna/elemento antes do cálculo — `RN-005`.
- Cálculo bloqueado se qualquer entrada obrigatória ausente — `RN-006`.

### Fundações — Tipos do Catálogo (código `{TipoPrefixo}-{TipoTorre}-{Tamanho}`)

> **Decisão de design (RN-224, spec 25)**: Os prefixos de tipo de fundação **variam por obra** conforme a convenção do projetista. Não existe um conjunto global fixo. Os tipos são registrados no catálogo da obra via upload de documentos FD aprovados ou cadastro manual. As tabelas abaixo listam exemplos típicos — outros projetos podem usar prefixos diferentes para os mesmos tipos físicos.

**Autoportante — pernas (exemplos):**
| Prefixo | Nome do tipo físico | Solo |
|---------|---------------------|------|
| **BR** | Bloco Ancorado em Rocha | Rochoso |
| **TCB** / **TB** | Tubulão a Céu Aberto | Normal |
| **S** | Sapata | Firme |
| **SES** | Sapata Especial | Firme |
| **EST** | Estaca | Mole |
| **ESTH** | Estaca Hélice | Especial |

**Estaiada — mastro central (exemplos):**
| Prefixo | Nome do tipo físico | Solo |
|---------|---------------------|------|
| **TSBM** / **TBM** | Tubulão Simples Bloco Mastro | Normal |
| **TCBM** / **TBM** | Tubulão c/ Base Alargada Mastro | Normal |
| **SPRM** | Sapata Piramidal Radier Mastro | Firme |
| **SPPM** | Sapata Piramidal c/ Placa Mastro | Firme |
| **BRM** | Bloco de Rocha Mastro | Rochoso |
| **ESTM** | Estaca Metálica Mastro | Mole |
| **ESTHM** | Estaca Hélice Mastro | Especial |

**Estaiada — estais (exemplos):**
| Prefixo | Nome do tipo físico | Solo |
|---------|---------------------|------|
| **TSBE** | Tubulão Simples Bloco Estai | Normal |
| **TCBE** / **TBE** | Tubulão c/ Base Alargada Estai | Normal |
| **VPME** | Viga de Placa Metálica Estai | Firme |
| **ESTE** | Estaca Estai | Mole |
| **ESTHE** | Estaca Hélice Estai | Especial |

- **Nenhum parâmetro livre** — toda fundação referencia item do catálogo — `RN-501`.
- Dados **teóricos** (projeto) separados de dados de **campo** (medição).
- Rastreabilidade obrigatória: documento → campo extraído → aprovação humana → cálculo.

### Dados e Auditoria
- Nenhum dado extraído por IA utilizado sem validação humana — `RN-207`.
- Toda edição humana auditada (quem, quando, antes/depois) — `RN-304`.
- Emissão final bloqueada se qualquer validação BLOQUEANTE ativa — `V-016`.

---

## 6. Páginas de Frontend (Angular v20+)

| Rota | Página |
|------|--------|
| `/auth/login` | Login |
| `/dashboard` | Dashboard — resumo geral de obras e pendências |
| `/obras` | Lista e criação de obras |
| `/obras/:id` | Detalhe da obra (torres, documentos, validações) |
| `/obras/:id/torres` | Torres da obra |
| `/obras/:id/documentos` | Documentos e status do pipeline de ingestão |
| `/obras/:id/validacao` | Fila de validação humana |
| `/obras/:id/catalogo` | Catálogo de fundações da obra (por obra — tipos extraídos de FD ou cadastrados manualmente) |
| `/torres/:id/autoportante` | Cálculo de torre autoportante |
| `/torres/:id/estaiada` | Cálculo de torre estaiada |

---

## 7. TODO / Pendências Globais

- Tabelas de armação (N1–N4 com bitola e qtd) para fundações autoportantes (BR, TCB, S, SES): TODO extrair de ARM-BLO/ARM-TUB/ARM-SAP.
- Dimensões reais autoportante (BR/TCB/S/SES por N5SSE/N5SA1/N5SSL): TODO popular o catálogo.
- Tabela A/B/C/D/H/L oficial por altura de torre N5SEL/N5SEM: TODO extrair.
- Faixas de validação numéricas (tolerâncias, Afl_min, etc.): TODO confirmar com engenharia.
- Dados completos N5SEM estaiada e demais torres estaiadas: TODO.
- Tipos de torre autoportante além de N5SSE/N5SA1/N5SSL: TODO catalogar.
- Modelos Roboflow: workspace ID e model ID por `documentType`: **unknown** — TODO configurar.
- Provider OCR definitivo (Google Document AI vs AWS Textract vs Azure): **unknown** — TODO.
- Política SSO/LDAP: **unknown** — TODO confirmar.
- Spec `42_FUNDACOES_VIGA.md` (VPME/ESTHE): **pendente de criação**.
- Prefixos de tipo de fundação são por obra (design decision RN-224): specs 30 e 55 ainda documentam prefixos como fixos — **TODO atualizar para indicar que são exemplos**. Spec 10 tem enum `FoundationType` fixo — **TODO avaliar substituição**.
- Entidades `TowerHeightSpec` e `StubSpec` (destinos de HEIGHT_FORMATION e STUB_DRAWING): **não definidas em nenhuma spec** — TODO criar na spec do tower-catalog.
- Renomeação `LOCATION_SURVEY` → `FIELD_SURVEY`: verificar referências residuais em specs 10, 15, 35, 70.
