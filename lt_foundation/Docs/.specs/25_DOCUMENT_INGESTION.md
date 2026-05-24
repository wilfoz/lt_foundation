# 25 — Pipeline de Ingestão de Documentos

> **Revisado com base nos documentos de exemplo reais** (2026-05-24):
> - `LT-L-GERAL-ES-A0-3134-1_-_N51SL - Stub.PDF` → tipo `STUB_DRAWING`
> - `LT-L-GERAL-ES-A1-3009-1_-_N51CR_-_Formação das Alturas e Locações.PDF` → tipo `HEIGHT_FORMATION`
> - `LT-L-GERAL-FD-A1-0057-00_-_TBE-N51CR-I.pdf` → tipo `FOUNDATION_PLAN`
> - `LT-L-GERAL-FD-A1-0101-00_-_TB-N51SL-II.pdf` → tipo `FOUNDATION_PLAN`

## 1. Objetivo
Definir o **pipeline híbrido de ingestão** de documentos (PDF e Excel) que extrai dados estruturados usando Roboflow (detecção de layout) + OCR (extração de texto em regiões rasterizadas) + Parser interno, alimentando a fila de validação humana (spec 35) antes de qualquer persistência no domínio.

## 2. Escopo
**In scope**: upload de arquivos, classificação automática por filename e conteúdo, integração com Roboflow, OCR, parser de campos, gestão de jobs do pipeline, fila de revisão humana, mapeamento de campos por `documentType`.

**Out of scope**: validação humana dos campos extraídos (spec 35), cálculo de fundações (spec 60), autenticação (spec 45).

## 3. Glossário

| Termo | Definição |
|-------|-----------|
| Job | Instância de execução do pipeline para um documento. |
| DocumentType | Classificação do documento — ver enum expandido §4. |
| TypeCode | Código de tipo do documento no nome do arquivo (`ES`, `FD`). |
| SheetType | Código de folha no nome do arquivo (`A0`, `A1`, `A2`…). |
| Region | Área do documento detectada pelo Roboflow (bounding box + label). |
| ExtractedField | Campo individual extraído pelo OCR, com valor bruto e confiança. |
| ParsedRecord | Registro JSON estruturado resultante do Parser. Um documento FD pode gerar **múltiplos** ParsedRecords (um por linha da tabela de dimensões). |
| ReviewQueue | Fila de itens aguardando validação humana (ver spec 35). |
| Confiança (confidence) | Score [0,1] retornado por Roboflow/OCR indicando certeza da extração. |
| TextLayer | Camada de texto vetorial do PDF. Documentos ES-A0 (stub) não possuem layer de texto — são inteiramente rasterizados. |
| SoilClass | Classe de solo romano (`I`, `II`, `III`) extraída do título do documento FD. |
| SizeVariant | Linha na tabela de dimensões de um documento FD (tamanho `I`, `II`, `III`…). |
| DocumentLabel | Rótulo legível derivado automaticamente do `documentType` + metadados extraídos do filename. Exibido na lista de documentos da obra. |
| ProjectCalculationConstants | Constantes de cálculo do projeto (W, stirrupsBase, stirrupSpacing, cobrimento…) extraídas do bloco de notas dos documentos de projeto via OCR. |
| TowerBatchList | Planilha Excel (`.xlsx`) com lista de torres em linhas, usada para cadastro em lote de torres da obra. |

## 4. Entidades do Domínio

```ts
class IngestionJob {                   // Raiz de agregado do pipeline
  id: IngestionJobId;
  workId: WorkId;
  workDocumentId: WorkDocumentId;
  fileName: string;
  fileType: 'PDF' | 'EXCEL';
  documentType: DocumentType;
  documentLabel: string;               // derivado automaticamente (RN-221) — ex.: "Fundação TB-N51SL-II"
  status: JobStatus;
  errorMessage?: string;
  createdAt: Date;
  completedAt?: Date;
  regions: DocumentRegion[];
  parsedRecords: ParsedRecord[];       // pode ter N registros (ex.: FD gera 1 por SizeVariant)
}

enum DocumentType {
  // --- Documentos de projeto/catálogo (alimentam foundation-catalog e tower-catalog) ---
  FOUNDATION_PLAN,   // FD-Ax: prancha de fundação — extrai catálogo de geometrias
  HEIGHT_FORMATION,  // ES-A1: "Formação das Alturas e Locações" — extrai tabela de alturas e locação teórica
  STUB_DRAWING,      // ES-A0: prancha de stubs — extrai geometria do stub por extensão

  // --- Documentos operacionais (alimentam foundation-design e survey) ---
  CALC_MEMORY,       // Memória de cálculo: dados teóricos Nc/Ncc por torre/perna
  FIELD_SURVEY,      // Levantamento de campo: dados medidos Nc/Ncc (era LOCATION_SURVEY)

  // --- Batch e desconhecido ---
  TOWER_LIST,        // Planilha Excel com lista de torres para cadastro em lote (ver §9.7)
  EXCEL_BATCH,       // Planilha Excel com dados de fundações/cálculos em colunas (uso geral)
  UNKNOWN,           // Não classificado; requer intervenção manual
}

enum JobStatus {
  UPLOADED,          // arquivo recebido
  CLASSIFYING,       // classificação em andamento
  ROBOFLOW_PENDING,  // aguardando Roboflow
  OCR_PENDING,       // aguardando OCR
  PARSING,           // parser executando
  PENDING_REVIEW,    // aguardando validação humana
  REVIEWED,          // aprovado/rejeitado pela validação
  FAILED,            // erro irrecuperável
}

class DocumentRegion {
  id: RegionId;
  jobId: IngestionJobId;
  label: string;            // ex.: "title_block", "dimension_table", "stub_table", "formation_table"
  boundingBox: BoundingBox; // { x, y, width, height }
  confidence: number;       // [0,1]
  extractedFields: ExtractedField[];
}

class ExtractedField {
  key: string;              // ex.: "foundationTypeCode", "soilClass", "sizeVariant_H"
  rawValue: string;         // valor bruto do OCR
  parsedValue?: unknown;    // valor após parser
  confidence: number;       // [0,1]
  regionId: RegionId;
  manuallyOverridden: boolean;
}

class ParsedRecord {
  jobId: IngestionJobId;
  entityType: EntityType;
  data: Record<string, unknown>; // JSON estruturado — schema por entityType (§9)
  confidence: number;            // média ponderada dos campos
  mappingVersion: string;        // versão do parser usado
  sourceRowIndex?: number;       // para FD: índice da linha na tabela (0-based)
}

enum EntityType {
  TOWER_STUB,         // dados de stub de STUB_DRAWING
  TOWER_HEIGHT,       // formação de altura/locação de HEIGHT_FORMATION
  FOUNDATION_CATALOG, // item de catálogo de fundação de FOUNDATION_PLAN (1 por SizeVariant)
  PROJECT_CONSTANTS,  // constantes de cálculo extraídas do bloco de notas (RN-222)
  TOWER,              // dados de torre de CALC_MEMORY / EXCEL_BATCH / TOWER_LIST
  LEG,                // dados de perna de CALC_MEMORY / EXCEL_BATCH
  STAY,               // dados de estai de CALC_MEMORY / EXCEL_BATCH
  LOCATION,           // dados de locação de FIELD_SURVEY
}
```

## 5. Entradas / Saídas

| Input | Obrigatório | Descrição |
|-------|-------------|-----------|
| Arquivo (PDF/XLSX) | Sim | Documento a ser processado |
| `workId` | Sim | Obra à qual o documento pertence |
| `documentType` hint | Não | Classificação manual opcional — pré-populada por filename |

| Output | Descrição |
|--------|-----------|
| `job.id` | UUID do job criado |
| `job.status` | Status corrente do pipeline |
| `job.documentLabel` | Rótulo legível derivado automaticamente (ex.: "Fundação TB-N51SL-II") |
| `job.parsedRecords` | JSON estruturado pronto para revisão (1..N registros) |
| `reviewQueue` items | Itens criados na fila de validação humana |

## 6. Regras de Negócio

- **RN-201**: Todo arquivo deve ser classificado antes de enviar ao Roboflow.
- **RN-202**: O Roboflow recebe o documento inteiro e retorna regiões com labels e bounding boxes.
- **RN-203**: O OCR processa apenas as regiões retornadas pelo Roboflow, não o documento completo.
- **RN-204**: O Parser transforma os campos extraídos pelo OCR em JSON estruturado conforme o `documentType`.
- **RN-205**: Campos com `confidence < THRESHOLD_LOW` (configurável, padrão 0.6) são marcados como `NEEDS_REVIEW`.
- **RN-206**: Campos com `confidence >= THRESHOLD_HIGH` (configurável, padrão 0.9) podem ser pré-aprovados, mas ainda passam pela fila humana.
- **RN-207**: Nenhum `ParsedRecord` é persistido no domínio sem aprovação humana (spec 35).
- **RN-208**: Excel batch bypassa Roboflow/OCR — colunas mapeadas diretamente para campos de entidades.
- **RN-209**: `documentType = UNKNOWN` bloqueia o pipeline; requer classificação manual pelo usuário.
- **RN-210**: Arquivos com tamanho > 50 MB são rejeitados na etapa de upload.
- **RN-211**: O workspace e model ID do Roboflow são configurados por `documentType` via variável de ambiente.
- **RN-212**: Falhas em Roboflow ou OCR transitam o job para `FAILED` após 3 tentativas; exibem mensagem de erro.
- **RN-213**: Excel batch deve ter pelo menos uma aba reconhecida pelo mapeamento configurado.

- **RN-214 — Classificação por Filename**: O nome do arquivo segue a convenção `LT-L-GERAL-{TypeCode}-{SheetType}-{Number}`. O `TypeCode` + `SheetType` fornecem o hint inicial de `documentType`:

  | TypeCode | SheetType | documentType inferido |
  |----------|-----------|-----------------------|
  | `ES`     | `A0`      | `STUB_DRAWING`        |
  | `ES`     | `A1`, `A2`| `HEIGHT_FORMATION`    |
  | `FD`     | qualquer  | `FOUNDATION_PLAN`     |
  | `MC`     | qualquer  | `CALC_MEMORY`         |
  | `LS`     | qualquer  | `FIELD_SURVEY`        |
  | outros   | —         | `UNKNOWN`             |

  > O hint de filename é apenas ponto de partida; o classificador automático e/ou o usuário podem sobrescrever.

- **RN-215 — Código de fundação nos documentos FD**: Documentos FD usam o padrão `{typePrefix}-{towerType}-{soilClass}` no título (ex.: `TB-N51SL-II`, `TBE-N51CR-I`). O `soilClass` romano no título refere-se à **classe de solo** (Solo I, Solo II…), não ao tamanho. O tamanho das variantes está nas linhas da TABELA interna do documento (§9.1).

- **RN-216 — Múltiplos ParsedRecords por FD**: Um único documento FD contém uma TABELA com N linhas, cada uma representando uma variante de tamanho. O Parser gera **um `ParsedRecord` por linha**, todos com `entityType = FOUNDATION_CATALOG`, diferenciados por `sourceRowIndex` e o campo `size`.

- **RN-217 — Documentos ES-A0 são inteiramente rasterizados**: Stubs drawings (ES-A0) não possuem camada de texto vetorial. Todo o conteúdo, incluindo o cabeçalho, requer OCR. O Roboflow deve ser treinado para detectar a região de tabela de dimensões do stub.

- **RN-218 — Documentos ES-A1 têm camada de texto parcial**: Documentos de formação de alturas (ES-A1) possuem apenas parte do conteúdo como texto vetorial (normalmente o cabeçalho). As tabelas de locação e formação de alturas são rasterizadas e requerem OCR.

- **RN-219 — Documentos FD têm camada de texto parcial**: Pranchas de fundação (FD) possuem alguns rótulos como texto vetorial, mas as tabelas de dimensões são rasterizadas. O sistema deve combinar extração de texto e OCR.

- **RN-220 — Destino por documentType**: Após aprovação humana (spec 35), cada `ParsedRecord` é persistido no bounded context correspondente:

  | documentType        | entityType gerado       | Destino após aprovação    | Entidade alvo                              |
  |---------------------|------------------------|--------------------------|-------------------------------------------|
  | `FOUNDATION_PLAN`   | `FOUNDATION_CATALOG`   | `foundation-catalog`     | `FoundationCatalogItem` (N por SizeVariant) |
  | `FOUNDATION_PLAN`   | `PROJECT_CONSTANTS`    | `obra`                   | `ProjectCalculationParams`                |
  | `HEIGHT_FORMATION`  | `TOWER_HEIGHT`         | `tower-catalog`          | `TowerHeightSpec`                         |
  | `STUB_DRAWING`      | `TOWER_STUB`           | `tower-catalog`          | `StubSpec`                                |
  | `CALC_MEMORY`       | `TOWER` / `LEG` / `STAY` | `foundation-design`   | `LegTheoreticalData` / `TowerElement.theoreticalData` |
  | `CALC_MEMORY`       | `PROJECT_CONSTANTS`    | `obra`                   | `ProjectCalculationParams`                |
  | `FIELD_SURVEY`      | `LOCATION`             | `survey`                 | `LocationSurvey` / `LegFieldData`         |
  | `TOWER_LIST`        | `TOWER`                | `obra`                   | `WorkTower` (cadastro em lote)            |
  | `EXCEL_BATCH`       | varia por coluna       | varia por coluna         | conforme mapeamento configurado           |

- **RN-221 — Label automático por documentType**: Imediatamente após a classificação (antes mesmo do Roboflow), o sistema deriva o `documentLabel` do `documentType` + metadados extraídos do filename. Regras de derivação:

  | documentType        | Formato do label                        | Exemplo                        | Fonte dos metadados          |
  |---------------------|-----------------------------------------|-------------------------------|------------------------------|
  | `FOUNDATION_PLAN`   | `"Fundação {foundationCode}"`           | `"Fundação TB-N51SL-II"`      | Sufixo do filename após o número |
  | `STUB_DRAWING`      | `"Projeto de Stub - {towerType}"`       | `"Projeto de Stub - N51SL"`   | Sufixo do filename após o número |
  | `HEIGHT_FORMATION`  | `"Composição de Altura - {towerType}"`  | `"Composição de Altura - N51CR"` | Sufixo do filename após o número |
  | `CALC_MEMORY`       | `"Memória de Cálculo - {towerType}"`    | `"Memória de Cálculo - N51SL"` | Sufixo do filename            |
  | `FIELD_SURVEY`      | `"Levantamento de Campo - {towerNumber}"` | `"Levantamento de Campo - 176/1"` | Conteúdo OCR (pós-pipeline)  |
  | `TOWER_LIST`        | `"Lista de Torres"`                     | `"Lista de Torres"`           | Fixo                         |
  | `EXCEL_BATCH`       | `"Lote Excel - {fileName}"`             | `"Lote Excel - dados.xlsx"`   | Nome do arquivo               |
  | `UNKNOWN`           | `"Documento não classificado"`          | —                             | Fixo até classificação manual |

  O label pode ser refinado após o OCR do `title_block` com dados mais precisos (ex.: confirmar `towerType`). Caso divergente do filename, o valor pós-OCR prevalece e dispara `NEEDS_REVIEW` no campo `documentLabel`.

- **RN-222 — Constantes de projeto extraídas dos documentos**: Os documentos de projeto (especialmente `FOUNDATION_PLAN` e `CALC_MEMORY`) contêm um bloco de notas (`notes_block`) com as constantes de cálculo utilizadas nas fórmulas. O parser deve tentar extrair esses valores e gerar um `ParsedRecord` adicional com `entityType = PROJECT_CONSTANTS`. Após aprovação humana, esses valores populam o `ProjectCalculationParams` da obra.

  Constantes a extrair (todos opcionais — presença varia por documento):

  | Campo | Identificação no texto | Unidade | Referência típica |
  |---|---|---|---|
  | `cobrimento` | "cobrimento mínimo", "cobrimento" | m | 0.08 m |
  | `acrescimoAncoragem` | "acréscimo de ancoragem" | m | 0.25 m |
  | `shaftInclinationW` | "inclinação do fuste", "tg", "tangente" | adimensional | 0.17126 |
  | `stirrupsBase` | "estribos base", "nº estribos fixos" | unidade | 14 |
  | `stirrupSpacing` | "espaçamento de estribos" | m | 0.15 m |
  | `coilSpacing` | "espaçamento de espiras" | m | 0.20 m |

  Regra: se `ProjectCalculationParams` já estiver definida para a obra e os valores extraídos diferirem, o sistema marca os campos divergentes como `NEEDS_REVIEW` na validação humana — **nunca sobrescreve silenciosamente**.

- **RN-223 — Cadastro em lote de torres via `TOWER_LIST`**: Ao fazer upload de uma planilha Excel (`TOWER_LIST`), o sistema lê cada linha como uma torre a ser cadastrada na obra. Cada linha gera um `ParsedRecord` com `entityType = TOWER`. Após aprovação humana, as torres são criadas como `WorkTower` vinculadas à obra. O pipeline bypassa Roboflow/OCR (processamento direto por colunas, igual ao `EXCEL_BATCH`). Ver schema obrigatório em §9.7.

- **RN-224 — Nomenclatura de tipos de fundação é por obra**: Os prefixos de tipo de fundação (`TB`, `TCB`, `TBE`, `TCBE`, `TM`, `TCBM`…) não são um conjunto fixo global — variam conforme a convenção adotada em cada obra pelo projetista. O sistema **não valida** o `foundationTypeCode` contra um enum fixo. As fontes válidas de nomenclatura são:

  1. **Extração automática**: ao processar um documento `FOUNDATION_PLAN`, o `foundationTypeCode` é extraído do `title_block` (ex.: `TB`, `TBE`, `TM`) e registrado no catálogo da obra após aprovação humana.
  2. **Cadastro manual**: o usuário pode registrar tipos de fundação diretamente na obra, informando o prefixo, nome completo e contexto de aplicação (perna autoportante, mastro ou estai).

  O catálogo de fundações (`foundation-catalog`) é, portanto, **por obra** — dois projetos diferentes podem usar `TB` e `TCB` para o mesmo tipo físico de fundação (tubulão a céu aberto) sem conflito.

## 7. Validações

| ID | Condição | Severidade |
|----|----------|-----------|
| V-201 | Arquivo não é PDF nem XLSX | Bloqueante |
| V-202 | Tamanho do arquivo > 50 MB | Bloqueante |
| V-203 | `documentType = UNKNOWN` sem classificação manual | Bloqueante |
| V-204 | Roboflow retorna 0 regiões | Alerta (prosseguir com OCR no doc inteiro) |
| V-205 | OCR retorna campo obrigatório vazio | Alerta |
| V-206 | Campo numérico extraído não parseable | Alerta |
| V-207 | Parser não reconhece nenhum campo mapeável | Bloqueante |
| V-208 | Excel: nenhuma coluna mapeada encontrada | Bloqueante |
| V-209 | Confiança média do job < 0.5 | Alerta |
| V-210 | FD: tabela de dimensões retorna 0 linhas | Bloqueante |
| V-211 | FD: `soilClass` romano inválido (não I, II ou III) | Alerta |
| V-212 | FD: `foundationTypeCode` extraído não encontrado no catálogo atual da obra — registrar como novo tipo pendente de confirmação humana | Informativa |
| V-213 | STUB_DRAWING: documento sem texto vetorial — forçar OCR completo | Informativa |
| V-214 | HEIGHT_FORMATION: tabela de locação de estais/mastros retorna 0 linhas | Alerta |
| V-215 | TOWER_LIST: colunas obrigatórias ausentes (`towerNumber`, `towerType`, `extension`) | Bloqueante |
| V-216 | TOWER_LIST: `towerType` não reconhecido no catálogo de torres | Alerta |
| V-217 | PROJECT_CONSTANTS: valor extraído fora do range físico esperado (ex.: W > 0.5 ou < 0.05) | Alerta |
| V-218 | PROJECT_CONSTANTS: constante extraída diverge de `ProjectCalculationParams` já definida — marcar NEEDS_REVIEW | Alerta |

## 8. Fluxos

### 8.1 Pipeline Principal (PDF)
```
1. Upload (POST /ingestion/upload)
   - Validar tamanho e tipo de arquivo (V-201, V-202)
   - Extrair hint de documentType pelo nome do arquivo (RN-214)
   - Criar IngestionJob [status: UPLOADED]
   - Salvar arquivo em storage

2. Classificação (automática + filename hint)
   - Usar hint de filename como candidato inicial
   - Modelo de classificação confirma ou corrige documentType
   - Se UNKNOWN → notificar usuário para classificação manual
   - [status: CLASSIFYING → ROBOFLOW_PENDING]

3. Roboflow
   - Enviar documento ao workspace/model configurado para o documentType
   - Receber regiões (label, bounding box, confidence)
   - Criar DocumentRegion[] no job
   - Para STUB_DRAWING (sem text layer): Roboflow detecta TODAS as regiões relevantes
   - [status: ROBOFLOW_PENDING → OCR_PENDING]

4. OCR
   - Para cada região, enviar crop para OCR
   - Para STUB_DRAWING: todo o documento passa por OCR (sem fallback de text layer)
   - Para FD / ES-A1: combinar text layer (onde disponível) + OCR nas regiões rasterizadas
   - Receber campos brutos (key, rawValue, confidence)
   - Criar ExtractedField[] por região
   - [status: OCR_PENDING → PARSING]

5. Parser
   - Para cada documentType, aplicar mapeamento de campos → entidades (§9)
   - FOUNDATION_PLAN: gerar 1 ParsedRecord(FOUNDATION_CATALOG) por linha da TABELA (RN-216)
                      + 1 ParsedRecord(PROJECT_CONSTANTS) se notes_block contiver constantes (RN-222)
   - HEIGHT_FORMATION: gerar 1 ParsedRecord(TOWER_HEIGHT) com extensionVariants[] + locationTable[]
   - STUB_DRAWING: gerar 1 ParsedRecord(TOWER_STUB) com stubVariants[]
   - CALC_MEMORY: gerar ParsedRecord[](TOWER/LEG/STAY) por torre/perna
                  + 1 ParsedRecord(PROJECT_CONSTANTS) se notas contiverem constantes (RN-222)
   - FIELD_SURVEY: gerar ParsedRecord[](LOCATION) por torre/perna
   - [status: PARSING → PENDING_REVIEW]

6. Fila de Validação Humana
   - Criar ReviewItem no módulo de validação (spec 35)
   - Notificar usuário
   - [status: PENDING_REVIEW — aguarda ação humana]
```

### 8.2 Pipeline Tower List (TOWER_LIST)
```
1. Upload (POST /ingestion/upload) — arquivo .xlsx
   - Detectar TOWER_LIST pelo hint de filename ou seleção manual do usuário
   - Criar IngestionJob [documentLabel: "Lista de Torres", status: UPLOADED]
   - Validar presença das colunas obrigatórias (V-215)

2. Parsing direto (sem Roboflow / OCR)
   - Ler header da aba principal
   - Validar colunas obrigatórias: towerNumber, towerType, extension
   - Para cada linha, gerar 1 ParsedRecord(TOWER) com os campos mapeados (§9.7)
   - [status: UPLOADED → PENDING_REVIEW]

3. Fila de Validação Humana
   - Revisão linha a linha: towerType reconhecido, extension plausível
   - Após aprovação → criar WorkTower[] na obra
```

### 8.3 Pipeline Excel Batch (EXCEL_BATCH — uso geral)
```
1. Upload → Criar IngestionJob [status: UPLOADED]
2. Mapeamento de colunas
   - Ler headers da planilha
   - Mapear colunas configuradas → campos de entidades
   - Gerar ParsedRecord[] por linha
   - [status: UPLOADED → PENDING_REVIEW]
3. Fila de Validação Humana (mesmo fluxo do PDF)
```

## 9. Mapeamento de Campos por DocumentType

### 9.1 `FOUNDATION_PLAN` (FD-Ax)

**Exemplos de documentos**: `LT-L-GERAL-FD-A1-0057-00_-_TBE-N51CR-I.pdf`, `LT-L-GERAL-FD-A1-0101-00_-_TB-N51SL-II.pdf`

**Regiões Roboflow esperadas**:

| Label Roboflow | Conteúdo |
|---|---|
| `title_block` | Cabeçalho com tipo de fundação, torre, solo, número de projeto |
| `section_cut_aa` | Corte longitudinal A-A (fuste + base) |
| `section_cut_bb` | Corte transversal B-B |
| `location_plan` | Planta de locação com parafusos/hastes |
| `dimension_table` | Tabela de dimensões com variantes de tamanho (TABELA 1 / TABELA 2) |
| `notes_block` | Bloco de notas técnicas |

**Schema do ParsedRecord** (entityType `FOUNDATION_CATALOG` — um por linha da TABELA):

```ts
interface FoundationCatalogParsedData {
  // Campos do title_block (idênticos em todos os records do mesmo job)
  foundationCode: string;        // ex.: "TB-N51SL-II", "TBE-N51CR-I"
  foundationTypeCode: string;    // ex.: "TB", "TBE", "TM", "TBM" — mapeia ao FoundationType enum
  towerType: string;             // ex.: "N51SL", "N51CR"
  soilClass: 'I' | 'II' | 'III'; // classe de solo do documento
  projectNumber: string;         // ex.: "LT-L-GERAL-FD-A1-0101-00"
  
  // Campos da TABELA (variam por linha / sourceRowIndex)
  size: string;                  // ex.: "I", "II", "III", "IV", "V"
  H: number;                     // profundidade total (m)
  D_fuste: number;               // diâmetro do fuste (m)
  D_base?: number;               // diâmetro da base alargada (m) — nulo se seção constante
  H_base?: number;               // altura da base alargada (m)
  H_saia?: number;               // altura da saia/transição (m)
  volExcavation?: number;        // volume de escavação (m³) — se presente na tabela
  volConcrete?: number;          // volume de concreto (m³) — se presente na tabela
  
  // Metadados de extração
  _sourceDocument: string;       // fileName do job
}
```

> **Nota sobre nomenclatura**: Os prefixos de tipo de fundação nos documentos FD (`TB`, `TBE`, `TM`, `TBM`…) variam conforme a convenção do projetista e da obra — não existe um conjunto fixo global. O parser registra o `foundationTypeCode` exatamente como aparece no documento, sem validar contra enum. Após aprovação humana, o tipo é incorporado ao catálogo da obra (ver RN-224).

---

### 9.2 `HEIGHT_FORMATION` (ES-A1)

**Exemplos de documentos**: `LT-L-GERAL-ES-A1-3009-1_-_N51CR_-_Formação das Alturas e Locações.PDF`

**Características**: Documento de **projeto/catálogo** que define os perfis de altura por extensão de uma torre e as locações teóricas de mastros/estais. **Não é um levantamento de campo** — representa dados teóricos (terreno plano). Camada de texto parcial: apenas o cabeçalho é vetorial; as tabelas são rasterizadas.

**Regiões Roboflow esperadas**:

| Label Roboflow | Conteúdo |
|---|---|
| `title_block` | Cabeçalho com tipo de torre, número de projeto |
| `tower_silhouettes` | Vistas laterais das extensões (informativo) |
| `height_formation_table` | Tabela de alturas por extensão (`Hu`, variantes `E+6`, `E+12`…) |
| `mast_stay_location_table` | Tabela "Locação dos Estais e Mastros" — distâncias teóricas por extensão |
| `foundation_location_table` | Tabela "Locação das Fundações" — coordenadas de locação por extensão |
| `notes_block` | Notas e referências |

**Schema do ParsedRecord** (entityType `TOWER_HEIGHT` — um por documento):

```ts
interface TowerHeightParsedData {
  towerType: string;              // ex.: "N51CR"
  classification: 'GUYED' | 'SELF_SUPPORTING';
  projectNumber: string;          // ex.: "LT-L-GERAL-ES-A1-3009-1"

  extensionVariants: {
    extension: number;            // Hu em metros
    label?: string;               // ex.: "E+6", "E+12"
  }[];

  mastStayLocationTable: {
    extension: number;
    mastDistance?: number;         // distância MC ao centro (m)
    stayDistances: {
      A?: number; B?: number; C?: number; D?: number;
    };
    H?: number;                    // altura de referência
    L?: number;                    // comprimento teórico do estai
  }[];

  foundationLocationTable: {
    extension: number;
    elements: {
      id: 'MC' | 'A' | 'B' | 'C' | 'D';
      x?: number;
      y?: number;
      distance?: number;
    }[];
  }[];
}
```

> **Atenção**: os valores desta tabela são **teóricos** (terreno plano). Não devem ser usados diretamente como locação final de campo — ver RN-208 e RN-223 na spec 30.

---

### 9.3 `STUB_DRAWING` (ES-A0)

**Exemplos de documentos**: `LT-L-GERAL-ES-A0-3134-1_-_N51SL - Stub.PDF`

**Características**: Prancha estrutural do stub — peça metálica embutida no concreto da fundação. **Inteiramente rasterizado** (sem camada de texto vetorial); todo o conteúdo requer OCR. Contém planta superior, cortes laterais e tabela de dimensões por extensão/tipo de perna.

**Regiões Roboflow esperadas**:

| Label Roboflow | Conteúdo |
|---|---|
| `title_block` | Cabeçalho com tipo de torre, número de projeto |
| `top_view` | Vista superior do stub (informativo para geometria) |
| `side_view_main` | Corte principal do stub |
| `stub_dimension_table` | Tabela de dimensões do stub por extensão de torre |
| `notes_block` | Notas e referências |

**Schema do ParsedRecord** (entityType `TOWER_STUB` — um por documento):

```ts
interface StubDrawingParsedData {
  towerType: string;              // ex.: "N51SL"
  projectNumber: string;          // ex.: "LT-L-GERAL-ES-A0-3134-1"

  stubVariants: {
    extension: number;            // Hu ou identificador da extensão
    legType?: 'A' | 'B' | 'C' | 'D' | 'MC'; // perna/elemento aplicável
    topHeight: number;            // altura da ponta do stub acima da concretagem (m)
    baseDepth?: number;           // profundidade de embutimento no concreto (m)
    section?: number;             // seção transversal do perfil (mm² ou mm)
    profileCode?: string;         // código do perfil metálico (ex.: "L150x150x19")
  }[];
}
```

---

### 9.4 `CALC_MEMORY` (Memória de Cálculo)

Documento de projeto com dados teóricos de Nc/Ncc por torre e perna. Alimenta `foundation-design` → `LegTheoreticalData`. **Schema a definir** — nenhum documento de exemplo disponível ainda.

```ts
// TODO: Confirmar campos após receber documento real de memória de cálculo
interface CalcMemoryParsedData {
  towerNumber: string;            // ex.: "176/1"
  towerType: string;
  extension: number;
  deflectionAngle?: Angle;
  legs?: {
    id: 'A' | 'B' | 'C' | 'D';
    Nc: number;                   // cota natural do terreno — teórico
    Ncc: number;                  // cota de concretagem — teórico
  }[];
  // para estaiadas:
  centralMast?: { Nc: number; Ncc: number };
  stays?: { id: 'A' | 'B' | 'C' | 'D'; Nc: number; Ncc: number }[];
}
```

---

### 9.5 `FIELD_SURVEY` (Levantamento de Campo)

Documento de levantamento topográfico com medições reais. Alimenta `survey` → `LegFieldData`. **Schema a definir** — nenhum documento de exemplo disponível ainda.

```ts
// TODO: Confirmar campos após receber documento real de levantamento
interface FieldSurveyParsedData {
  towerNumber: string;
  surveyDate: string;
  surveyedBy?: string;
  equipment?: { id: string; calibCert: string; expiry: string };
  points: {
    id: 'A' | 'B' | 'C' | 'D' | 'MC';
    Nc: number;                   // cota natural — medido em campo
    Ncc?: number;                 // cota de concretagem — medido em campo
    cotaCC?: number;
    cotaRef?: number;
    DH?: number;
  }[];
}
```

---

### 9.6 `PROJECT_CONSTANTS` (entityType gerado por `FOUNDATION_PLAN` e `CALC_MEMORY`)

Gerado **adicionalmente** aos records principais quando o parser detecta constantes de cálculo no `notes_block`. Um por documento (se houver constantes). Após aprovação humana persiste no `ProjectCalculationParams` da obra.

```ts
interface ProjectConstantsParsedData {
  // Cada campo é opcional — presente apenas se extraído com sucesso do documento
  cobrimento?: number;              // cobrimento mínimo do concreto (m). Ex.: 0.08
  acrescimoAncoragem?: number;      // acréscimo de ancoragem (m). Ex.: 0.25
  shaftInclinationW?: number;       // tangente de inclinação do fuste (W). Ex.: 0.17126
  stirrupsBase?: number;            // número base de estribos fixos. Ex.: 14
  stirrupSpacing?: number;          // espaçamento de estribos em blocos (m). Ex.: 0.15
  coilSpacing?: number;             // espaçamento de espiras em tubulões (m). Ex.: 0.20

  // Metadados de extração
  _sourceDocument: string;          // fileName do job
  _sourceRegion: string;            // label da região onde foram encontradas (ex.: "notes_block")

  // Divergências (preenchidas pelo parser ao comparar com ProjectCalculationParams existente)
  _divergences?: {
    field: string;
    existingValue: number;
    extractedValue: number;
  }[];
}
```

---

### 9.7 `TOWER_LIST` (Cadastro em Lote de Torres)

Planilha Excel com lista de torres da obra. Cada linha gera um `ParsedRecord(TOWER)`. Após aprovação humana, cada record cria um `WorkTower` associado à obra.

**Colunas obrigatórias** (header case-insensitive, snake_case ou com espaços):

| Coluna | Campo | Tipo | Exemplo |
|--------|-------|------|---------|
| `torre` / `tower_number` | `towerNumber` | string | `"176/1"` |
| `tipo` / `tower_type` | `towerType` | string | `"N51SL"`, `"N51CR"` |
| `extensao` / `extension` | `extension` | number | `6.0` |

**Colunas opcionais**:

| Coluna | Campo | Tipo | Exemplo |
|--------|-------|------|---------|
| `deflexao` / `deflection_angle` | `deflectionAngle` | string | `"11°09'15"D"` |
| `utm_e` / `utm_east` | `utmEast` | number | `456789.12` |
| `utm_n` / `utm_north` | `utmNorth` | number | `8901234.56` |
| `cota` / `elevation` | `utmElevation` | number | `342.5` |
| `vao_frente` / `front_span` | `frontSpan` | number | `450.0` |
| `fund_a` | `foundationCodeLegA` | string | `"TB-N51SL-II"` |
| `fund_b` | `foundationCodeLegB` | string | `"TB-N51SL-II"` |
| `fund_c` | `foundationCodeLegC` | string | `"TB-N51SL-II"` |
| `fund_d` | `foundationCodeLegD` | string | `"TB-N51SL-II"` |
| `fund_mc` | `foundationCodeMC` | string | `"TBM-N51CR-I"` |
| `fund_estai_a` | `foundationCodeStayA` | string | `"TBE-N51CR-I"` |
| `fund_estai_b` | `foundationCodeStayB` | string | `"TBE-N51CR-I"` |
| `fund_estai_c` | `foundationCodeStayC` | string | `"TBE-N51CR-I"` |
| `fund_estai_d` | `foundationCodeStayD` | string | `"TBE-N51CR-I"` |

**Schema do ParsedRecord** (entityType `TOWER` — um por linha):

```ts
interface TowerListParsedData {
  towerNumber: string;
  towerType: string;
  extension: number;
  deflectionAngle?: string;
  utmEast?: number;
  utmNorth?: number;
  utmElevation?: number;
  frontSpan?: number;
  // autoportante
  foundationCodeLegA?: string;
  foundationCodeLegB?: string;
  foundationCodeLegC?: string;
  foundationCodeLegD?: string;
  // estaiada
  foundationCodeMC?: string;
  foundationCodeStayA?: string;
  foundationCodeStayB?: string;
  foundationCodeStayC?: string;
  foundationCodeStayD?: string;
  // linha de origem
  _sourceRowIndex: number;
}
```

> **Nota**: Após aprovação humana, o sistema valida `towerType` contra o catálogo de torres e, se os códigos de fundação estiverem preenchidos, valida cada um contra o `foundation-catalog`. Fundações não reconhecidas geram alerta (V-216) — não bloqueiam o cadastro da torre, mas ficam pendentes de resolução.

## 10. Requisitos de UI/UX

### Página: `/obras/:id/documentos`
- Lista de documentos com colunas: **rótulo** (`documentLabel`), tipo (`documentType` badge), status do pipeline, registros extraídos, data de upload.
- O `documentLabel` substitui o nome de arquivo bruto na exibição — ex.: "Fundação TB-N51SL-II" em vez de "LT-L-GERAL-FD-A1-0101-00_-_TB-N51SL-II.pdf".
- Badge de status com cor: cinza (UPLOADED), azul (processando), amarelo (PENDING_REVIEW), verde (REVIEWED), vermelho (FAILED).
- Badge de `documentType` com ícone: 🏗 Fundação / 📐 Composição de Altura / 🔩 Stub / 📊 Lote de Torres / 📋 Batch.
- Botão "Novo Upload" abre modal de upload com drag & drop.
- Botão separado **"Importar Lista de Torres"** abre modal específico para `TOWER_LIST`.
- Modal de classificação manual para `UNKNOWN`, com seletor de `documentType` e hint pré-preenchido pelo filename.
- Botão "Reprocessar" para jobs `FAILED`.
- Coluna "Registros extraídos" mostrando contagem de `ParsedRecord[]` por job (ex.: "5 fundações + 1 constantes").

### Componente: UploadModal (PDF / genérico)
- Drag & drop ou seleção de arquivo.
- Preview do nome e tamanho.
- Preview do `documentLabel` derivado do filename logo após selecionar o arquivo — editável pelo usuário.
- Selector de `documentType` (opcional — pré-populado via filename hint).
- Progress bar durante upload.

### Componente: TowerListImportModal
- Drag & drop ou seleção de arquivo `.xlsx`.
- Preview da aba a ser importada e contagem de linhas detectadas.
- Mapeamento de colunas: sistema sugere mapeamento automático; usuário confirma/corrige.
- Preview das primeiras 5 linhas da tabela parseada.
- Botão "Importar" inicia pipeline TOWER_LIST.

### Componente: JobStatusCard
- Timeline visual das etapas: Upload → Classificação → Roboflow → OCR → Parser → Revisão.
- Cada etapa com status (pendente / em andamento / concluído / erro).
- Link "Revisar" quando `PENDING_REVIEW`.
- Contagem de `ParsedRecord`s gerados e quantos com `needsReview`.

### Angular v20+
- `DocumentListComponent`, `UploadModalComponent`, `JobStatusCardComponent` — standalone.
- Signals para polling de status do job.
- SSE (Server-Sent Events) ou WebSocket para atualizações em tempo real do pipeline.

## 11. Módulos / Serviços

### Outbound Ports
- `FileStoragePort` — armazenar e recuperar arquivos.
- `RoboflowPort` — detectar regiões em documentos.
- `OcrPort` — extrair texto de regiões (provider configurável).
- `IngestionJobRepository` — persistir jobs e registros.
- `ReviewQueuePort` — enfileirar itens para validação humana.

### Inbound / Use Cases
- `UploadDocumentUseCase` — recebe arquivo, extrai hint de filename, cria job, inicia pipeline.
- `ClassifyDocumentUseCase` — classifica tipo do documento (filename hint + modelo).
- `ProcessRoboflowUseCase` — envia para Roboflow e armazena regiões.
- `ProcessOcrUseCase` — executa OCR nas regiões; para STUB_DRAWING, processa documento inteiro.
- `ParseExtractedDataUseCase` — transforma campos OCR em ParsedRecord[] (1..N por documentType).
- `RetryFailedJobUseCase` — reprocessa job com erro.

### Adapters (Infrastructure)
- `RoboflowHttpAdapter` — HTTP client para API Roboflow.
- `OcrProviderAdapter` — abstrai provider OCR (Google Document AI, AWS Textract ou Azure Form Recognizer — a definir).
- `S3FileStorageAdapter` (ou `LocalFileStorageAdapter` para dev).
- `PostgresIngestionJobRepositoryAdapter`.
- `ExcelColumnMapperAdapter` — leitura e mapeamento de colunas Excel (EXCEL_BATCH + TOWER_LIST).
- `TowerListParserAdapter` — parser específico para TOWER_LIST: valida colunas obrigatórias, gera ParsedRecord(TOWER) por linha.
- `ProjectConstantsExtractorAdapter` — extrai constantes do `notes_block` e compara com `ProjectCalculationParams` existente.
- `FilenameMetadataExtractorAdapter` — extrai TypeCode + SheetType + metadados de sufixo (towerType, foundationCode) para derivar `documentLabel`.
- `IngestionController` — NestJS REST controller (inclui endpoint dedicado `POST /ingestion/tower-list`).

### Configuração por documentType

| documentType | Roboflow workspace | Roboflow model | OCR mode |
|---|---|---|---|
| `FOUNDATION_PLAN` | `lt-foundation-ws` | `foundation-plan-v1` | Regiões detectadas + extração de PROJECT_CONSTANTS do notes_block |
| `HEIGHT_FORMATION` | `lt-foundation-ws` | `height-formation-v1` | Regiões detectadas |
| `STUB_DRAWING` | `lt-foundation-ws` | `stub-drawing-v1` | **Documento inteiro** (sem text layer) |
| `CALC_MEMORY` | `lt-foundation-ws` | `calc-memory-v1` | Regiões detectadas + extração de PROJECT_CONSTANTS |
| `FIELD_SURVEY` | `lt-foundation-ws` | `field-survey-v1` | Regiões detectadas |
| `TOWER_LIST` | — (bypass) | — (bypass) | — (parser direto por colunas) |
| `EXCEL_BATCH` | — (bypass) | — (bypass) | — (direct mapping) |

> Workspace ID, model ID e API keys configurados via variáveis de ambiente (`ROBOFLOW_WORKSPACE`, `ROBOFLOW_MODEL_*`, `OCR_PROVIDER`, `OCR_PROJECT`).

## 12. Critérios de Aceitação

- **CA-250**: Upload de PDF cria IngestionJob com status `UPLOADED` e retorna `job.id`.
- **CA-251**: Pipeline PDF transita pelas etapas: UPLOADED → CLASSIFYING → ROBOFLOW_PENDING → OCR_PENDING → PARSING → PENDING_REVIEW.
- **CA-252**: Upload de XLSX com colunas reconhecidas gera ParsedRecord[] e vai direto para PENDING_REVIEW.
- **CA-253**: Arquivo > 50 MB retorna erro V-202 e não cria job.
- **CA-254**: Job com `documentType = UNKNOWN` fica bloqueado em CLASSIFYING até classificação manual.
- **CA-255**: Falha no Roboflow após 3 tentativas transita job para FAILED com mensagem de erro.
- **CA-256**: Nenhum ParsedRecord persiste no domínio sem passar pela fila de validação humana (CA-350).
- **CA-257**: Campos com `confidence < 0.6` são marcados `NEEDS_REVIEW` na fila de validação.
- **CA-258**: Configurações de Roboflow (workspace, model) são carregadas de variáveis de ambiente, não hardcoded.
- **CA-259**: Upload de `FD-A1` com tabela de 5 linhas gera exatamente 5 ParsedRecords com `entityType = FOUNDATION_CATALOG`.
- **CA-260**: Filename `LT-L-GERAL-ES-A0-*` pré-classifica automaticamente como `STUB_DRAWING`.
- **CA-261**: Filename `LT-L-GERAL-ES-A1-*` pré-classifica automaticamente como `HEIGHT_FORMATION`.
- **CA-262**: Filename `LT-L-GERAL-FD-*` pré-classifica automaticamente como `FOUNDATION_PLAN`.
- **CA-263**: Para STUB_DRAWING, o pipeline envia o documento inteiro ao OCR (não por região) pois não há text layer.
- **CA-264**: ParsedRecord de FOUNDATION_PLAN contém: `foundationTypeCode`, `towerType`, `soilClass`, `size`, `H`, `D_fuste`.
- **CA-265**: ParsedRecord de HEIGHT_FORMATION contém: `towerType`, `extensionVariants[]`, `mastStayLocationTable[]`.
- **CA-266**: Após aprovação humana, ParsedRecord de `FOUNDATION_PLAN` persiste como `FoundationCatalogItem` no bounded context `foundation-catalog`.
- **CA-267**: Após aprovação humana, ParsedRecord de `HEIGHT_FORMATION` persiste como `TowerHeightSpec` no bounded context `tower-catalog`.
- **CA-268**: Upload de `LT-L-GERAL-FD-A1-0101-00_-_TB-N51SL-II.pdf` produz `documentLabel = "Fundação TB-N51SL-II"` imediatamente após a classificação, antes mesmo de completar o OCR.
- **CA-269**: Upload de `LT-L-GERAL-ES-A0-3134-1_-_N51SL - Stub.PDF` produz `documentLabel = "Projeto de Stub - N51SL"`.
- **CA-270**: Upload de `LT-L-GERAL-ES-A1-3009-1_-_N51CR_-_Formação das Alturas e Locações.PDF` produz `documentLabel = "Composição de Altura - N51CR"`.
- **CA-271**: Upload de `FOUNDATION_PLAN` com bloco de notas contendo `W = 0.17126` gera ParsedRecord adicional com `entityType = PROJECT_CONSTANTS` e `shaftInclinationW = 0.17126`.
- **CA-272**: Se `ProjectCalculationParams` já definido com `shaftInclinationW = 0.17126` e o documento extrair `W = 0.20000`, o campo `shaftInclinationW` no ParsedRecord de PROJECT_CONSTANTS chega à revisão com `NEEDS_REVIEW = true` e divergência registrada.
- **CA-273**: Upload de lista de torres em `.xlsx` com colunas `torre`, `tipo`, `extensao` e 50 linhas gera 50 ParsedRecords com `entityType = TOWER`. Após aprovação humana, 50 `WorkTower` são criados na obra.
- **CA-274**: Lista de torres com colunas `towerNumber` e `towerType` mas sem `extension` retorna erro V-215 (bloqueante) e não cria o job.
- **CA-275**: Colunas opcionais de fundação presentes na lista de torres (`fund_a`, `fund_b`…) são capturadas no ParsedRecord e validadas contra o catálogo após aprovação.

## 13. TODO / Pendências

### Mapeamento de campos (requer documentos reais)
- Mapeamento completo de campos `CALC_MEMORY`: **TODO — aguardar documento de memória de cálculo real**.
- Mapeamento completo de campos `FIELD_SURVEY`: **TODO — aguardar documento de levantamento de campo real**.
- Schema detalhado de `StubDrawingParsedData.stubVariants` (dimensões reais do stub): **TODO calibrar com ES-A0 real após OCR**.
- Colunas exatas das tabelas "LOCAÇÃO DOS ESTAIS E MASTROS" e "LOCAÇÃO DAS FUNDAÇÕES" nos documentos ES-A1: **TODO calibrar após OCR dos documentos de exemplo**.

### Infraestrutura
- Provider OCR definitivo (Google Document AI vs AWS Textract vs Azure Form Recognizer): **TODO**.
- Threshold de confiança por tipo de campo (numérico vs texto vs enum): **TODO calibrar**.
- Modelos Roboflow: IDs de workspace e model para cada `documentType`: **TODO configurar e treinar**.
- Classificador automático de `documentType` (além do hint de filename): **TODO**.
- Política de retenção de arquivos no storage: **TODO**.

### Constantes de projeto
- Padrões exatos de texto presentes nos `notes_block` dos documentos FD/CALC_MEMORY para identificar cada constante: **TODO calibrar após OCR dos documentos reais**.
- Ranges de validação física por constante (ex.: limites de W, stirrupsBase, cobrimento): **TODO confirmar com engenharia**.
- Tratamento quando `ProjectCalculationParams` ainda não existir para a obra e o documento for o primeiro a definir as constantes: **TODO — definir se aprovação direta ou ainda passa por revisão humana**.

### Lista de torres (TOWER_LIST)
- Validação do `towerType` contra catálogo: definir se bloqueia ou apenas alerta quando tipo desconhecido: **TODO confirmar**.
- Comportamento ao importar torre com `towerNumber` já existente na obra (duplicata): **TODO — sobrescrever, ignorar, ou gerar conflito para revisão**.
- Suporte a múltiplas abas na planilha de lista de torres (uma por trecho/lote): **TODO confirmar necessidade**.

### Specs relacionadas a atualizar
- Entidade `TowerHeightSpec` (destino de HEIGHT_FORMATION) e `StubSpec` (destino de STUB_DRAWING) não estão definidas em nenhuma spec de domínio: **TODO definir em spec 10 ou criar spec específica do tower-catalog**.
- `FIELD_SURVEY` era `LOCATION_SURVEY` na versão anterior — verificar referências cruzadas em outras specs (10, 15, 35, 70): **TODO**.
- Spec 55 (`CATALOGO_FUNDACOES`) e spec 30 (`ESTAIADAS`) ainda documentam prefixos de tipo como valores fixos: **TODO atualizar para refletir que nomenclatura é por obra (RN-224)**.
- Spec 10 (`DOMAIN_OVERVIEW`) tem enum `FoundationType` com valores fixos: **TODO avaliar substituição por string obra-específica ou catálogo por obra**.
