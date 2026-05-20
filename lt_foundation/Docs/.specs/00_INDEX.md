# Índice de Especificações — Sistema de Fundações de Torres (LT)

> **Aviso de Padrão**: O `<specs_style>` não foi fornecido. Aplicamos abaixo um **padrão consistente** que deve ser seguido por todas as specs deste diretório. Este padrão fica declarado neste índice e referenciado pelos demais documentos.

## 1. Padrão de Documentação Aplicado

### 1.1 Convenção de Nomes
- Arquivos prefixados por número de duas posições (`NN_NOME.md`) indicando ordem de leitura.
- Substantivos em PT-BR, MAIÚSCULAS para domínios principais (ex.: `AUTOPORTANTES`, `ESTAIADAS`).
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
- Qualquer parâmetro não fornecido pelo `<data>` deve ser marcado explicitamente como `unknown` e listado na seção **TODO / Pendências** do arquivo correspondente.

---

## 2. Mapa de Specs

| # | Arquivo | Conteúdo |
|---|---------|----------|
| 00 | `00_INDEX.md` | Este índice e padrão. |
| 05 | `05_ARCHITECTURE_AND_STACK.md` | Stack (Angular v20+, NestJS, Tailwind, Docker Compose, PostgreSQL), Clean Architecture, DDD, Hexagonal, TDD, convenções de código em inglês. |
| 10 | `10_DOMAIN_OVERVIEW.md` | Visão de domínio (DDD), bounded contexts, agregados. |
| 20 | `20_AUTOPORTANTES.md` | Torres autoportantes, fundações por perna (A/B/C/D). |
| 30 | `30_ESTAIADAS.md` | Torres estaiadas, Mastro Central + Estais (A/B/C/D). |
| 40 | `40_FUNDACOES_TUBULAO.md` | Fundação tipo Tubulão (autoportante e estaiada). |
| 41 | `41_FUNDACOES_SAPATA.md` | Fundação tipo Sapata (autoportante e estaiada). |
| 50 | `50_VALIDACOES_E_ALERTAS.md` | Catálogo global de validações e alertas. |
| 60 | `60_CALCULOS_E_FORMULARIOS.md` | Motor de cálculo: fórmulas, ângulos, locação, volumes. |
| 70 | `70_API_CONTRATOS.md` | Contratos/API: DTOs e endpoints sugeridos. |

---

## 3. Decisões Arquiteturais Globais

- **Estilo**: DDD + Clean Architecture + Arquitetura Hexagonal (Ports & Adapters). Ver `05_ARCHITECTURE_AND_STACK.md`.
- **Stack**: Angular v20+ (Tailwind CSS), NestJS, PostgreSQL, Docker Compose, TypeScript.
- **Metodologia de Testes**: TDD (Red → Green → Refactor); pirâmide Unit / Integration / E2E.
- **Linguagem do Código**: **inglês** (classes, métodos, variáveis, tabelas). Specs e UI permanecem em PT-BR.
- **Bounded Contexts** (slugs de módulo):
  - `tower-catalog` (catálogo de torres e tipos).
  - `foundation-design` (motor de cálculo de fundações).
  - `survey` (topografia/locação: cotas, PA, PF, PC).
  - `spreadsheet-emission` (emissão da planilha final).
- **Linguagem ubíqua**: glossários PT-BR em cada spec; mapeamento PT-BR → EN no `05_ARCHITECTURE_AND_STACK.md` §6.
- **Persistência**: PostgreSQL acessado via Repository Ports; adapter implementado em Prisma ou TypeORM (definir).

---

## 4. Premissas Globais

- O **usuário** define quais fundações se aplicam para a torre.
- Pode haver **mais de um tipo de fundação** disponível por caso (autoportante/estaiada).
- Em uma **mesma torre**, podem coexistir fundações de **tipos diferentes**:
  - Autoportante: por perna A/B/C/D.
  - Estaiada: por elemento (MC + Estais A/B/C/D).
- Nenhum cálculo é executado sem que todos os inputs obrigatórios estejam preenchidos ou marcados como `unknown` + `TODO`.

---

## 5. TODO / Pendências Globais

- `<specs_style>` real do repositório: **unknown** — TODO: receber padrão oficial do cliente e revisar.
- Tabelas de armação (aço) detalhadas por tipo de fundação: **unknown** — TODO: extrair do banco de fundações anexo.
- Faixas de validação numéricas (tolerâncias, mín/máx) por parâmetro: **unknown** — TODO: confirmar com engenharia.
