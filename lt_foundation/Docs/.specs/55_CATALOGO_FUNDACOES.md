# 55 — Catálogo Tipificado de Fundações

## 1. Objetivo
Definir o **catálogo de tipos de fundação por obra** — com os códigos extraídos dos documentos de projeto (FD) ou informados manualmente pelo usuário — suas dimensões, parâmetros de geometria, regras de seleção e versionamento. Nenhum parâmetro de fundação pode ser definido livremente: toda fundação deve referenciar um item do catálogo da obra.

> **Decisão de design**: os prefixos de tipo de fundação (`TB`, `TCB`, `TBE`, `TCBE`, `TBM`, `TCBM`…) não são um conjunto global fixo — variam conforme a convenção adotada em cada obra pelo projetista. O catálogo é, portanto, **por obra**. Os tipos são registrados de duas formas: (1) automaticamente via upload e aprovação de documentos `FOUNDATION_PLAN` (spec 25, RN-224), ou (2) manualmente pelo usuário com role `ADMIN` ou `ENGINEER`.

## 2. Escopo
**In scope**: registro de tipos de fundação por obra (via documento FD aprovado ou cadastro manual), formato de código, dimensões, armação por tipo, versionamento por obra.

**Out of scope**: cálculos volumétricos e de profundidade (specs 40, 41, 60), ingestão de documentos (spec 25), autenticação (spec 45).

> **Exemplos de prefixos por projeto**: um projeto pode usar `TB`/`TBE` enquanto outro usa `TCB`/`TCBE` para o mesmo tipo físico (tubulão a céu aberto). Ambos são válidos dentro de suas respectivas obras.

## 3. Glossário

| Código | Nome Completo | Contexto |
|--------|--------------|---------|
| BR | Bloco Ancorado em Rocha | Autoportante — pernas |
| TCB | Tubulão a Céu Aberto | Autoportante — pernas |
| S | Sapata | Autoportante — pernas |
| SES | Sapata Especial | Autoportante — pernas |
| EST | Estaca | Autoportante — pernas |
| ESTH | Estaca Hélice | Autoportante — pernas |
| TSBM | Tubulão Simples para Bloco de Mastro | Estaiada — mastro |
| TCBM | Tubulão com Base Alargada para Bloco de Mastro | Estaiada — mastro |
| SPRM | Sapata Piramidal para Radier de Mastro | Estaiada — mastro |
| SPPM | Sapata Piramidal com Placa para Mastro | Estaiada — mastro |
| BRM | Bloco de Rocha para Mastro | Estaiada — mastro |
| ESTM | Estaca Metálica para Mastro | Estaiada — mastro |
| ESTHM | Estaca Hélice para Mastro | Estaiada — mastro |
| TSBE | Tubulão Simples para Bloco de Estai | Estaiada — estais |
| TCBE | Tubulão com Base Alargada para Bloco de Estai | Estaiada — estais |
| VPME | Viga de Placa Metálica para Estai | Estaiada — estais |
| ESTE | Estaca para Estai | Estaiada — estais |
| ESTHE | Estaca Hélice para Estai | Estaiada — estais |
| Catálogo | Conjunto versionado de itens de fundação de uma obra específica. | — |
| Variante | Instância específica de um tipo (ex.: `TCB-N5SSE-IV`, `TB-N51SL-II`). | — |
| CatalogVersion | Versão ativa do catálogo de uma obra (semântico). | — |
| FoundationTypeRegistration | Ato de registrar um tipo de fundação no catálogo da obra — via FD aprovado ou cadastro manual. | — |
| TypePrefix | Código de prefixo do tipo de fundação (ex.: `TB`, `TCB`, `TBE`, `TCBE`). Definido pela convenção do projetista; varia por obra. | — |

> **Nota**: Os prefixos listados no glossário acima (BR, TCB, S, SES…) são **exemplos** provenientes de um projeto específico (N5SEL/N5SSE). Outros projetos podem usar prefixos diferentes para os mesmos tipos físicos de fundação.

## 4. Formato do Código de Fundação

```
{TipoPrefixo}-{TipoTorre}-{TamanhoRomano}
```

O `{TipoPrefixo}` é definido pela convenção do projetista e extraído diretamente do documento FD da obra. Não existe um conjunto global de prefixos válidos — o valor extraído do documento é o valor canônico para aquela obra.

```
Exemplos — Projeto A (usa prefixo TCB):
  TCB-N5SSE-IV    → Tubulão a Céu Aberto p/ N5SSE, tamanho IV
  TCBM-N5SEL-II   → Tubulão c/ Base Alargada Mastro p/ N5SEL, tamanho II
  TCBE-N5SEL-I    → Tubulão c/ Base Alargada Estai p/ N5SEL, tamanho I

Exemplos — Projeto B (usa prefixo TB):
  TB-N51SL-II     → Tubulão a Céu Aberto p/ N51SL, tamanho II
  TBM-N51CR-I     → Tubulão Mastro p/ N51CR, tamanho I
  TBE-N51CR-I     → Tubulão Estai p/ N51CR, tamanho I

Outros elementos (independentes do projeto):
  S-N5SA1-V       → Sapata p/ N5SA1, tamanho V
  VPME-N5SEL-II   → Viga Placa Metálica Estai p/ N5SEL, tamanho II
```

## 5. Entidades do Domínio

```ts
class FoundationCatalogItem {           // Raiz de agregado
  id: CatalogItemId;
  workId: WorkId;                       // catálogo é por obra — RN-224 (spec 25)
  code: string;                         // Ex.: "TCB-N5SSE-IV", "TB-N51SL-II"
  typePrefix: string;                   // convenção da obra — extraída do FD ou informada manualmente
  label: string;                        // descrição legível PT-BR (ex.: "Tubulão a Céu Aberto")
  geometry: FoundationGeometryVO;
  reinforcement: ReinforcementSpec[];   // posições N1..N4 com bitola e qtd padrão
  stubCompatibility: StubRange[];
  applicableTo: TowerClassification[];  // SELF_SUPPORTING | GUYED_MAST | GUYED_STAY
  catalogVersion: string;               // semver por obra, ex.: "1.0.0"
  registrationSource: 'DOCUMENT' | 'MANUAL'; // como foi registrado
  sourceDocumentId?: IngestionJobId;    // job FD que originou este item (se DOCUMENT)
  active: boolean;
  deprecatedAt?: Date;
}

enum TowerClassification {
  SELF_SUPPORTING,   // autoportante — pernas
  GUYED_MAST,        // estaiada — mastro central
  GUYED_STAY,        // estaiada — estais
}

// Geometria — Tubulão (TCB, TSBM, TCBM, TSBE, TCBE)
class TubulaoGeometry {
  diameter: number;                     // diâmetro do fuste / Ø principal (m)
  diameterBase?: number;                // diâmetro da base alargada (m) — nulo para simples
  heightSaia?: number;                  // Hs — altura da saia/alargamento (m)
  heightBase?: number;                  // H base (m)
  totalDepth: number;                   // profundidade total (m)
  volumeExcavation: number;             // m³
  volumeConcrete: number;               // m³
}

// Geometria — Sapata/SPRM/SPPM (S, SES, SPRM, SPPM)
class SapataGeometry {
  length: number;                       // L (m)
  breadth?: number;                     // C — largura (m)
  height: number;                       // H — altura (m)
  totalDepth?: number;                  // profundidade total (m)
  distPF_CC?: number;                   // Dist PF-CC (m) — apenas VPME
  backfill?: number;                    // volume de reaterro (m³)
  volumeExcavation: number;
  volumeConcrete: number;
}

// Geometria — Viga Placa Metálica (VPME)
class VPMEGeometry {
  length: number;                       // L (m)
  breadth: number;                      // C (m)
  height: number;                       // H (m)
  distPF_CC: number;                    // distância PF ao Centro da Cava (m)
  backfill: number;                     // reaterro (m³)
  volumeExcavation: number;
  volumeConcrete: number;
}

// Especificação de armação por posição
class ReinforcementSpec {
  position: 'N1' | 'N2' | 'N3' | 'N4';
  barDiameter: number;                  // mm
  steelType: 'CA-50' | 'CA-60';
  quantity: number;                     // quantidade padrão para o tamanho
  unitLength: number;                   // m — comprimento calculado por fórmula de domínio
}

class StubRange {
  minSection: number;                   // mm²
  maxSection: number;                   // mm²
  minLength: number;                    // m
}
```

## 6. Tabela Mestre de Bitolas e Pesos do Aço

| Bitola (mm) | Peso (kg/m) | Tipo de Aço |
|-------------|-------------|-------------|
| 6.3  | 0.245–0.252 | CA-60 |
| 8.0  | 0.395       | CA-50 |
| 10.0 | 0.628       | CA-50 |
| 12.5 | 0.963–1.00  | CA-50 |
| 16.0 | 1.60–1.601  | CA-50 |
| 20.0 | 2.50–2.466  | CA-50 |
| 25.0 | 3.853–4.07  | CA-50 |
| 32.0 | 6.313       | CA-50 |
| 40.0 | 9.865       | CA-50 |

## 7. Dimensões Reais por Tipo — Fundações Estaiadas

### 7.1 Fundações de Mastro (N5SEL)

| ID | Código | Ø (m) | Ø Saia (m) | H Saia (m) | H Base (m) | Prof (m) | Vol.Esc (m³) | Vol.Conc (m³) | Peso Arm (kg) | Nº Projeto |
|----|--------|-------|-----------|-----------|-----------|----------|-------------|--------------|--------------|------------|
| 1 | TSBM-N5SEL-I  | 1.2 | — | — | — | 6.4  | 7.24  | 7.46  | 273.68 | LT-L-GERAL-FD-A1-9000 |
| 2 | TSBM-N5SEL-IS | 1.2 | — | — | — | 7.8  | 8.82  | 9.05  | 330.94 | LT-L-GERAL-FD-A1-9000 |
| 3 | TSBM-N5SEL-II | 1.2 | — | — | — | 9.1  | 10.29 | 10.52 | 383.65 | LT-L-GERAL-FD-A1-9000 |
| 4 | TSBM-N5SEL-III | 1.5 | — | — | — | 10.4 | 18.38 | 18.73 | 666.73 | LT-L-GERAL-FD-A1-9000 |
| 5 | TCBM-N5SEL-I  | 1.0 | 2.0 | 0.7 | 0.2 | 3.0 | 3.56 | 3.72 | 96.67  | LT-L-GERAL-FD-A1-9001 |
| 6 | TCBM-N5SEL-II | 1.0 | 2.0 | 0.7 | 0.2 | 3.8 | 4.19 | 4.35 | 119.94 | LT-L-GERAL-FD-A1-9001 |
| 7 | TCBM-N5SEL-III | 1.2 | 2.4 | 0.9 | 0.2 | 5.5 | 8.26 | 8.48 | 236.41 | LT-L-GERAL-FD-A1-9001 |
| 8 | SPRM-N5SEL-I  | 0.5 | 1.5 | 0.3 | 0.2 | 1.6 | 4.62 | 1.08 | 39.88  | LT-L-GERAL-FD-A1-9002 |
| 9 | SPRM-N5SEL-II | 0.5 | 1.5 | 0.3 | 0.2 | 1.75| 7.00 | 1.08 | 39.88  | LT-L-GERAL-FD-A1-9002 |
| 10 | SPRM-N5SEL-III | 0.5 | 1.5 | 0.3 | 0.2 | 2.0 | 12.5 | 1.08 | 39.88 | LT-L-GERAL-FD-A1-9002 |
| 11 | SPPM-N5SEL-I  | 0.5 | 1.5 | 0.3 | 0.2 | 1.65| 6.80 | 1.08 | 59.73  | LT-L-GERAL-FD-A1-9003 |

### 7.2 Fundações de Mastro (N5SEM)

| ID | Código | Ø (m) | Prof (m) | Vol.Esc (m³) | Vol.Conc (m³) | Peso Arm (kg) |
|----|--------|-------|----------|-------------|--------------|--------------|
| 12 | TSBM-N5SEM-I  | 1.5 | 5.6  | 9.90  | 10.25 | 366.41 |
| 13 | TSBM-N5SEM-II | 1.5 | 8.8  | 15.55 | 15.90 | 566.62 |
| 14 | TCBM-N5SEM-I  | 1.0 | 3.0  | 3.56  | 3.72  | 96.67  |

### 7.3 Fundações de Estai (N5SEL)

| ID | Código | Ø (m) | Dist PF-CC (m) | Reaterro (m³) | Prof (m) | Vol.Esc (m³) | Vol.Conc (m³) | L (m) | C (m) | H (m) | Peso Arm (kg) | Nº Projeto |
|----|--------|-------|---------------|--------------|----------|-------------|--------------|-------|-------|-------|--------------|------------|
| 1 | TSBE-N5SEL-I   | 1.0 | — | — | 4.2 | 3.30 | 3.46 | — | — | — | 134.81 | LT-L-GERAL-FD-A1-9005 |
| 2 | TSBE-N5SEL-II  | 1.0 | — | — | 4.6 | 3.61 | 3.77 | — | — | — | 151.27 | LT-L-GERAL-FD-A1-9005 |
| 3 | TSBE-N5SEL-III | 1.0 | — | — | 5.1 | 4.01 | 4.16 | — | — | — | 181.98 | LT-L-GERAL-FD-A1-9005 |
| 4 | TCBE-N5SEL-I   | 1.0 | — | — | 4.2 | 4.50 | 4.66 | — | — | — | 134.81 | LT-L-GERAL-FD-A1-9006 |
| 5 | TCBE-N5SEL-II  | 1.0 | — | — | 4.6 | 4.82 | 4.97 | — | — | — | 151.27 | LT-L-GERAL-FD-A1-9006 |
| 6 | TCBE-N5SEL-III | 1.0 | — | — | 5.1 | 5.21 | 5.37 | — | — | — | 181.98 | LT-L-GERAL-FD-A1-9006 |
| 7 | TCBE-N5SEL-IV  | 1.0 | — | — | 5.8 | 5.76 | 5.92 | — | — | — | 215.34 | LT-L-GERAL-FD-A1-9006 |
| 8 | VPME-N5SEL-I   | — | 1.30 | 3.93 | 2.45 | 8.32 | 0.67 | 1.3 | 2.6 | 1.3 | 116.64 | LT-L-GERAL-FD-A1-9007 |
| 9 | VPME-N5SEL-II  | — | 1.38 | 4.78 | 2.61 | 10.27| 0.67 | 1.4 | 2.8 | 1.4 | 116.64 | LT-L-GERAL-FD-A1-9007 |
| 10 | VPME-N5SEL-III | — | 1.48 | 5.92 | 2.80 | 12.67| 0.67 | 1.5 | 3.0 | 1.5 | 116.64 | LT-L-GERAL-FD-A1-9007 |

### 7.4 Fundações de Estai (N5SEM)

| ID | Código | Ø (m) | Prof (m) | Vol.Esc (m³) | Vol.Conc (m³) | Peso Arm (kg) |
|----|--------|-------|----------|-------------|--------------|--------------|
| 11 | TSBE-N5SEM-I  | 1.0 | 4.6 | 3.61 | 3.77 | 180.29 |
| 12 | TSBE-N5SEM-II | 1.0 | 5.0 | 3.93 | 4.08 | 195.08 |

## 8. Regras de Negócio

- **RN-501**: Toda fundação atribuída deve referenciar um `CatalogItemId` válido e ativo.
- **RN-502**: Parâmetros de geometria são somente-leitura após seleção — nenhum valor livre é aceito.
- **RN-503**: Fundações com base alargada (TCBM, TCBE): `D_base > D_fuste`.
- **RN-504**: TSBM, TSBE: seção constante, sem alargamento (`D_base` ausente).
- **RN-505**: S, SES, SPRM, SPPM: L > 0, C > 0, H > 0.
- **RN-506**: SPPM: possui placa metálica; dimensões do pedestal menores que a sapata base.
- **RN-507**: VPME: aplicável **exclusivamente** a estais de torres estaiadas (`GUYED_STAY`).
- **RN-508**: EST, ESTH (autoportante), ESTE, ESTHE (estai): fundações profundas; profundidade de projeto obrigatória.
- **RN-509**: Seleção de item depreciado (`active = false`) é bloqueada.
- **RN-510**: O catálogo é versionado **por obra**; versões anteriores acessíveis para histórico da obra.
- **RN-511**: Alterar o catálogo requer role `ADMIN` ou `ENGINEER`.
- **RN-512**: Compatibilidade com stub verificada antes de confirmar a seleção.
- **RN-513**: Vol.Esc ≥ Vol.Conc por item do catálogo (invariante de integridade dos dados cadastrais).
- **RN-514 — Registro via documento**: Ao aprovar um `ReviewItem` de `documentType = FOUNDATION_PLAN`, o sistema registra automaticamente cada `ParsedRecord(FOUNDATION_CATALOG)` como um novo `FoundationCatalogItem` na obra, com `registrationSource = 'DOCUMENT'` e `sourceDocumentId` referenciando o job. Se o `code` já existir no catálogo da obra, o item existente é mantido e a divergência de dimensões é sinalizada para revisão.
- **RN-515 — Registro manual**: Usuário com role `ADMIN` ou `ENGINEER` pode cadastrar manualmente um tipo de fundação na obra, informando: `typePrefix`, `label`, `applicableTo`, e geometria. O registro manual tem `registrationSource = 'MANUAL'`.
- **RN-516 — Validação por obra**: A verificação de `CatalogItemId` válido (RN-501) é feita sempre contra o catálogo da obra (`workId`) — itens de outras obras não são visíveis ou selecionáveis.

## 9. Validações

| ID | Condição | Severidade |
|----|----------|-----------|
| V-501 | Referência a `CatalogItemId` inexistente | Bloqueante |
| V-502 | Item com `active = false` | Bloqueante |
| V-503 | TCBM/TCBE sem `D_base > D_fuste` | Bloqueante |
| V-504 | Stub incompatível com o item selecionado | Bloqueante |
| V-505 | SPPM com pedestal maior que sapata base | Bloqueante |
| V-506 | VPME/ESTHE/ESTE atribuído a perna de autoportante | Bloqueante |
| V-507 | Geometria com dimensão ≤ 0 | Bloqueante |
| V-508 | Catálogo vazio para o tipo/classificação consultado | Alerta |
| V-509 | Bitola de armação fora da tabela mestre (§6) | Bloqueante |
| V-510 | Vol.Esc < Vol.Conc no item cadastrado | Alerta |

## 10. Tipos de Fundação — Resumo Estendido

### Autoportante — Pernas

| Tipo | Nome Completo | Solo | Características |
|------|--------------|------|-----------------|
| BR | Bloco Ancorado em Rocha | Rochoso | Fuste + bloco; usa afloramento; RD-104 (W=0.17126) |
| TCB | Tubulão a Céu Aberto | Normal | Escavação circular; armadura helicoidal (espiras) |
| S | Sapata | Solo firme | Fundação rasa retangular L × C × H |
| SES | Sapata Especial | Solo firme | Sapata com reforço adicional |
| EST | Estaca | Solo mole | Fundação profunda; comprimento definido em projeto |
| ESTH | Estaca Hélice | Solo especial | Estaca moldada in loco |

### Estaiada — Mastro

| Tipo | Nome Completo | Solo | Notas |
|------|--------------|------|-------|
| TSBM | Tubulão Simples Bloco Mastro | Normal | Seção constante |
| TCBM | Tubulão c/ Base Alargada Mastro | Normal | Base > fuste |
| SPRM | Sapata Piramidal Radier Mastro | Firme | Formato piramidal |
| SPPM | Sapata Piramidal c/ Placa Mastro | Firme | Com placa metálica |
| BRM | Bloco de Rocha Mastro | Rochoso | Ancorado em rocha |
| ESTM | Estaca Metálica Mastro | Mole | Perfil metálico |
| ESTHM | Estaca Hélice Mastro | Especial | Moldada in loco |

### Estaiada — Estais

| Tipo | Nome Completo | Solo | Notas |
|------|--------------|------|-------|
| TSBE | Tubulão Simples Bloco Estai | Normal | Seção constante |
| TCBE | Tubulão c/ Base Alargada Estai | Normal | Base > fuste |
| VPME | Viga de Placa Metálica Estai | Firme | Dist PF-CC e Cota CC especiais |
| ESTE | Estaca Estai | Mole | Fundação profunda |
| ESTHE | Estaca Hélice Estai | Especial | Moldada in loco |

## 11. Fluxos

### 11.1 Consulta ao Catálogo da Obra
```
GET /obras/:workId/catalog/foundations?towerClassification=SELF_SUPPORTING
→ lista de CatalogItem ativos da obra, filtrados por classificação
→ usuário seleciona item pelo código
→ sistema valida stub compatibility (RN-512)
→ geometria e armação do item são vinculados à perna/elemento
```

### 11.2 Registro via Documento FD (automático)
```
1. Upload do documento FOUNDATION_PLAN (spec 25, §8.1)
2. Pipeline: Roboflow → OCR → Parser → ParsedRecord(FOUNDATION_CATALOG)
3. Validação humana: revisor inspeciona campos extraídos (spec 35)
4. Aprovação → ApproveReviewItemUseCase chama DomainPersistencePort →
   RegisterFoundationFromDocumentUseCase:
     - Para cada ParsedRecord(FOUNDATION_CATALOG):
       - Cria FoundationCatalogItem com workId da obra
       - registrationSource = 'DOCUMENT', sourceDocumentId = job.id
       - Se code já existe: compara dimensões, sinaliza divergências
     - Incrementa versão do catálogo da obra
```

### 11.3 Registro Manual
```
POST /obras/:workId/catalog/foundations
  Body: { typePrefix, label, applicableTo, geometry, reinforcement? }
  → valida role ADMIN ou ENGINEER (RN-515)
  → cria FoundationCatalogItem com registrationSource = 'MANUAL'
  → incrementa versão do catálogo da obra
```

### 11.4 Seed de Catálogo de Referência (dev/staging)
```
npm run prisma:seed
  → popula uma obra de referência com itens de fundação de exemplo
    (dados das tabelas §7 — N5SEL, N5SEM, N5SSE, N5SA1)
  → uso exclusivo em ambientes de desenvolvimento
  → produção: catálogo sempre vem de documentos FD ou cadastro manual
```

## 12. Requisitos de UI/UX

### Página `/obras/:id/catalogo`
- Catálogo exibido no contexto da obra — apenas itens com `workId` correspondente.
- Tabs por contexto: **Autoportante** e **Estaiada** (Mastro | Estai).
- Subtabs por `typePrefix` dentro de cada contexto (geradas dinamicamente — não hardcoded).
- Tabela com colunas: código, fonte (`DOCUMENT` | `MANUAL`), dimensões principais, vol.esc, vol.conc, peso arm total.
- Indicador de versão ativa do catálogo da obra.
- Botão "Deprecar item" (somente ADMIN/ENGINEER).
- Botão "Adicionar tipo" — abre formulário de cadastro manual (RN-515).
- Indicador de origem: ícone de documento para itens vindos de FD; ícone de lápis para manuais.
- Badge de aviso quando código de item já existente diverge de nova extração (RN-514).

### Componente `FoundationSelectorModal`
- Abre ao selecionar fundação para perna/elemento.
- Filtra por tipo de torre (ex.: N5SEL) e contexto (perna/mastro/estai).
- Preview de dimensões + armação (N1–N4) ao selecionar.
- Confirmar seleção fecha modal e vincula `CatalogItemId`.

## 13. Módulos / Serviços
- **Ports**: `FoundationCatalogRepository` — consulta, CRUD, versionamento por obra.
- **Use Cases**:
  - `ListWorkFoundationCatalogUseCase` — lista itens ativos do catálogo de uma obra.
  - `GetCatalogItemUseCase` — busca item por `workId` + `code`.
  - `RegisterFoundationFromDocumentUseCase` — registra item(ns) a partir de `ParsedRecord(FOUNDATION_CATALOG)` aprovado; implementa RN-514.
  - `RegisterFoundationManuallyUseCase` — cadastro manual por ADMIN/ENGINEER; implementa RN-515.
  - `DeprecateCatalogItemUseCase` — depreca item ativo.
  - `SelectFoundationForLegUseCase` — seleciona fundação para perna de autoportante.
  - `SelectFoundationForElementUseCase` — seleciona fundação para mastro/estai de estaiada.
- **Adapters**: `PostgresFoundationCatalogRepositoryAdapter`, `CatalogController`, `FoundationCatalogSeeder` (dev/staging).

## 14. Critérios de Aceitação
- **CA-550**: `GET /obras/:workId/catalog/foundations` retorna apenas itens ativos da obra especificada; itens de outras obras não aparecem.
- **CA-551**: Seleção de item depreciado → erro V-502.
- **CA-552**: VPME para perna de autoportante → erro V-506.
- **CA-553**: Stub incompatível → erro V-504.
- **CA-554**: Geometria somente-leitura após seleção.
- **CA-555**: Aprovação de `FOUNDATION_PLAN` com 5 linhas na tabela cria exatamente 5 `FoundationCatalogItem` na obra, com `registrationSource = 'DOCUMENT'`.
- **CA-556**: Header `X-Catalog-Version` em todas as respostas de catálogo, refletindo a versão da obra.
- **CA-557**: Registro manual via `POST /obras/:workId/catalog/foundations` cria item com `registrationSource = 'MANUAL'`.
- **CA-558**: Upload de FD com `code = "TB-N51SL-II"` em obra A e upload de FD com `code = "TCB-N5SSE-IV"` em obra B resultam em catálogos isolados por obra, sem interferência.
- **CA-559**: Upload de FD cujo `code` já existe no catálogo da obra com dimensões diferentes sinaliza divergência (V-212) sem sobrescrever o item existente.

## 15. TODO / Pendências
- Dimensões reais de fundações autoportantes (BR, TB/TCB, S, SES, EST, ESTH por tipo de torre): TODO — serão extraídas dos documentos FD via pipeline de ingestão.
- Armação padrão (N1–N4 com bitola e qtd): TODO — extrair das planilhas ARM-BLO/ARM-TUB/ARM-SAP via pipeline ou cadastro manual.
- Dados completos N5SEM e demais torres estaiadas: TODO (apenas N5SEL está mapeado completamente na §7 como referência).
- Critério de compatibilidade stub × fundação (tabela de seções): TODO confirmar com engenharia.
- Política de versionamento por obra: TODO definir quando incrementa major vs minor.
- Spec 10 (`DOMAIN_OVERVIEW`): enum `FoundationType` usa valores fixos — TODO avaliar substituição por string por obra alinhada com `typePrefix` do catálogo.
- Spec 30 (`ESTAIADAS`): referencia prefixos como `TCBM`, `TCBE` como fixos — TODO atualizar para indicar que são exemplos por projeto.
