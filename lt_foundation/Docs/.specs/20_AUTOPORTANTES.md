# 20 — Torres Autoportantes (`SelfSupportingTower`)

> Frontend: Angular v20+ + Tailwind. Backend: NestJS módulo `tower-catalog` + `foundation-design`. Ver `05_ARCHITECTURE_AND_STACK.md`.

## 1. Objetivo
Especificar o subdomínio de torres **autoportantes**, com 4 pernas (A/B/C/D), onde cada perna pode receber um tipo de fundação distinto do catálogo de projeto (BR, TCB, S, SES, EST, ESTH — ver `55_CATALOGO_FUNDACOES.md`). O catálogo de fundações é **definido pelo usuário no momento do upload do projeto**: para cada tipo o usuário informa o nome (ex.: `TCB`), a condição de solo e o tamanho (`I`, `II`, `III`, `IV`, `V`, `IA`, `IIA`, `IIIA`, `R`, `E`), vinculados ao tipo de torre (ex.: `N5SL`).

## 2. Escopo
**In scope**: cadastro, seleção de fundação por perna, cálculos (volumes + armação), locação por perna, validações, emissão de formulários ENG.

**Out of scope**: torre estaiada (ver `30_ESTAIADAS.md`); cálculo estrutural da torre.

## 3. Glossário
Ver `10_DOMAIN_OVERVIEW.md`. Termos exclusivos desta spec:

| Termo PT-BR | EN (código) | Definição |
|-------------|-------------|-----------|
| Perna A/B/C/D | `Leg` | Apoio estrutural; posicionamento sentido horário a partir do alinhamento da LT. |
| Armação | `reinforcement` | Conjunto de barras de aço (posições N1–N4) da fundação, com bitola, quantidade, comprimento e peso. |
| Posição de Ferro | `ironPosition` | Identificador de posição da barra na armação (N1, N2, N3, N4). |
| Bitola | `barDiameter` | Diâmetro nominal da barra de aço em mm. |
| Estribo | `stirrup` | Armadura transversal de confinamento da armação. |
| Espira | `coil` | Volta da armadura helicoidal em tubulões. |
| Fuste | `shaft` | Coluna vertical de concreto que conecta o bloco ao stub. |
| Cota CC | `caveCenterElevation` | Cota do Centro da Cava (referência topográfica). |
| Cota PC | `referenceControlPoint` | Cota do Ponto de Controle = 100.0m (referência absoluta de nivelamento). |
| Cota Ref | `referenceElevation` | Cota de referência topográfica auxiliar. |
| DH | `horizontalDiff` | Desnível Horizontal entre dois pontos topográficos. |
| Afloramento Rocha | `rockOutcrop` | Exposição natural da rocha; diferença `Cota_Topo - Cota_Base`. |
| Equipamento de Medição | `measurementEquipment` | Instrumento topográfico com certificado de calibração. |
| Formulário ENG | `engineeringForm` | Documento padronizado Form.ENG-XXX de controle de campo. |

## 4. Entidades de Domínio (DDD)

```
SelfSupportingTower : Tower
├── id: UUID                           // identificador interno (gerado pelo sistema)
├── towerNumber: string                // ex.: "176/1" (Nº/Circuito — vem do projeto)
├── type: TowerType                    // ex.: N5SSE, N5SA1, N5SSL
├── extension: number                  // extensão em metros (ex.: 6.0, 30.0)
├── deflectionAngle: Angle             // { deg, min, sec, dir: 'D'|'E' }
├── utmCoords: { east, north, elevation }
├── frontSpan: number                  // vão de frente (m)
└── legs: [Leg(A), Leg(B), Leg(C), Leg(D)]

Leg
├── id: 'A'|'B'|'C'|'D'
├── foundationCode: string             // ex.: "BR-N5SSE-VI", "TCB-N5SSE-IV", "S-N5SA1-V"
├── foundation: Foundation             // referencia o ProjectFoundationCatalogItem do projeto
├── surveyPoint: SurveyPoint
├── stub: StubData                     // { type, topLocation, baseLocation }
├── reinforcement: Reinforcement
└── derived: { Afl, H, H_sub, NFC, G, volumes, locationPoints }

// Código da fundação: {Prefixo}-{TipoTorre}-{TamanhoRomano}
// Prefixo: "BR" | "TCB" | "S" | "SES" | "EST" | "ESTH"
// Tamanho: I | II | III | IV | V | IA | IIA | IIIA | R | E
// Exemplos: BR-N5SSE-VI, TCB-N5SSE-IV, S-N5SA1-V, SES-N5SA1-V

// Catálogo de fundações é por projeto — definido pelo usuário no upload:
ProjectFoundationCatalogItem
├── id: UUID
├── workId: WorkId                     // obra/projeto ao qual pertence
├── typeName: string                   // nome do tipo, ex.: "TCB", "BR", "S"
├── soilCondition: string              // condição de solo (ex.: "normal", "rochoso", "mole")
├── size: 'I'|'II'|'III'|'IV'|'V'|'IA'|'IIA'|'IIIA'|'R'|'E'
├── towerType: string                  // tipo de torre ao qual se aplica, ex.: "N5SL", "N5SSE"
└── geometry: FoundationGeometryVO

Foundation [Autoportante]
├── catalogItemId: UUID                // referência ao ProjectFoundationCatalogItem
├── typeName: string                   // "BR" | "TCB" | "S" | "SES" | "EST" | "ESTH"
├── geometry: FoundationGeometryVO     // somente-leitura (vem do catálogo do projeto)
│    ├── L: number                     // comprimento total (m)
│    ├── D?: number                    // diâmetro maior (m) — tubulão
│    ├── d?: number                    // diâmetro menor / fuste (m) — tubulão
│    ├── H: number                     // altura (m)
│    └── Hs?: number                   // altura da saia/base alargada (m)
└── rockOutcrop?: number               // afloramento de rocha (m) — apenas BR

SurveyPoint
├── Nc: number                         // cota natural do terreno (m)
├── Ncc: number                        // cota de concretagem (m)
├── cotaCC?: number                    // cota do Centro da Cava (m)
├── cotaRef?: number                   // cota de Referência topográfica (m)
├── DH?: number                        // desnível horizontal (m)
└── distToCenter: number               // distância horizontal ao PC em planta (m)

Reinforcement
├── positions: IronPosition[]          // N1, N2, N3, N4
└── totalWeight: number                // kg — soma de todas as posições

IronPosition
├── label: 'N1'|'N2'|'N3'|'N4'
├── barDiameter: number                // mm (ex.: 16.0, 6.3, 25.0)
├── steelType: 'CA-50'|'CA-60'
├── quantity: number
├── unitLength: number                 // m
├── totalLength: number                // m (= quantity × unitLength)
├── unitWeight: number                 // kg/m (da tabela de bitolas)
└── totalWeight: number                // kg (= totalLength × unitWeight)

MeasurementEquipment
├── equipmentNumber: string
├── calibrationCertificate: string
└── certificateExpiry: Date

// Parâmetros de projeto (definidos no upload — podem variar por projeto):
ProjectCalculationParams
├── workId: WorkId
├── stirrupsBase: number               // base fixa de estribos (referência: 14)
├── shaftInclinationTangent: number    // W — tangente de inclinação do fuste (referência: 0.17126)
└── stirrupSpacing: number             // espaçamento de estribos em blocos — m (referência: 0.15)
```

## 5. Inputs vs Outputs

| Categoria | Input | Output |
|-----------|-------|--------|
| Upload de projeto | Tipos de fundação: nome, condição de solo, tamanho (I..E), tipo de torre | `ProjectFoundationCatalogItem` por projeto |
| Parâmetros de projeto | stirrupsBase, shaftInclinationTangent (W), stirrupSpacing | `ProjectCalculationParams` por projeto |
| Identificação | Nº Torre (ex.: 176/1), Tipo (ex.: N5SSE), Extensão (6.0), Hu | UUID interno + towerNumber |
| Geometria horizontal | Ângulo de deflexão (11°09'15"D) | Bissetriz; ângulos por perna |
| Coordenadas | UTM Este, Norte, Cota; Vão de Frente | Georreferenciamento |
| Topografia | Cotas Nc(A..D), Ncc, Cota CC por perna | Afl, G, H_sub, NFC por perna |
| Seleção | Código de fundação por perna (ex.: BR-N5SSE-VI) | `Foundation` por perna (do catálogo do projeto) |
| Armação | Bitola por posição N1..N4 | Qtd, comprimentos, pesos por posição; total kg |
| Stub | Tipo, locação Topo/Base | Locação do stub na fundação |
| Equipamento | Nº equipamento, certificado, vencimento | Registro documental |

## 6. Regras de Negócio

### Estrutura
- **RN-101**: Toda torre autoportante possui **exatamente** 4 pernas A, B, C, D.
- **RN-102**: Cada perna referencia **uma** fundação do catálogo.
- **RN-103**: É permitido **misturar tipos** de fundação entre pernas (ex.: A/B com TCB; C/D com S).
- **RN-104**: A seleção de fundação por perna é **obrigatória** antes do cálculo.
- **RN-105**: Ângulos de cada perna são derivados da bissetriz e do alinhamento da LT; nunca editados manualmente.
- **RN-106**: Afloramento (Afl) é específico de cada perna pois Nc varia por ponto.
- **RN-107**: Emissão final só ocorre após todas as 4 pernas terem cálculos válidos.
- **RN-108**: Alinhamento no **topo da estrutura**: `Nc[i] + Afl[i] + L[i] = constante`. Forma simplificada (L idêntico): `Afl[i] = Ncc - Nc[i]`.
- **RN-109**: Ncc ≥ max(Nc[A..D]) + Afl_min. Validar humanamente se vier de campo.

### Catálogo de Fundações por Projeto
- **RN-110**: O catálogo de tipos de fundação é **definido por projeto** no momento do upload. Para cada tipo o usuário informa: nome do tipo (ex.: `TCB`), condição de solo, tamanho (`I`, `II`, `III`, `IV`, `V`, `IA`, `IIA`, `IIIA`, `R`, `E`) e tipo de torre ao qual se aplica (ex.: `N5SL`).
- **RN-111**: O comportamento de cálculo de cada tipo é determinado pelo **prefixo do nome**:
  - `"BR"` → Bloco Ancorado em Rocha (fuste + bloco, afloramento de rocha)
  - `"TCB"` → Tubulão a Céu Aberto (escavação circular, armadura helicoidal)
  - `"S"` → Sapata (fundação rasa, base alargada)
  - `"SES"` → Sapata Especial (sapata com reforço adicional)
  - `"EST"` → Estaca (fundação profunda, solo mole)
  - `"ESTH"` → Estaca Hélice (estaca moldada in loco)
- **RN-112**: Formato do código de fundação: `{Nome}-{TipoTorre}-{Tamanho}`. Ex.: `BR-N5SSE-VI`, `TCB-N5SSE-IV`, `S-N5SA1-V`.
- **RN-113**: Formato do número da torre: `{Número}/{Circuito}`. Ex.: `176/1` = Torre 176, Circuito 1. O `towerNumber` é lido do projeto; o `id` (UUID) é gerado pelo sistema.
- **RN-114**: Fundações de tipos diferentes podem ser atribuídas a pernas da mesma torre (ex.: A/B com TCB; C/D com S).

### Parâmetros de Cálculo por Projeto
Os parâmetros abaixo são configuráveis por projeto (definidos no upload). Os valores abaixo são **referências típicas**, não constantes fixas:

- **RD-101**: Cobrimento mínimo de concreto = **0.08 m** (constante física — não varia por projeto).
- **RD-102**: Acréscimo de ancoragem = **0.25 m** (constante física — não varia por projeto).
- **RD-103**: `stirrupsBase` — número base de estribos fixos por fundação (**referência: 14**; definido no projeto).
- **RD-104**: `shaftInclinationTangent` (W) — tangente de inclinação do fuste (**referência: 0.17126**; definido no projeto).
- **RD-105**: Cota PC = **100.0 m** — referência topográfica para todos os desníveis (constante de campo).
- **RD-106**: `stirrupSpacing` — espaçamento de estribos em blocos (**referência: 0.15 m**; definido no projeto).
- **RD-107**: Tipo de aço por diâmetro: **CA-50** (Ø ≥ 8 mm) / **CA-60** (Ø = 6.3 mm) — norma ABNT, invariável.

### Equipamento
- **RN-115**: Todo equipamento de medição deve possuir número de identificação, certificado de calibração e data de vencimento preenchidos (registro documental).

## 7. Validações

| ID | Regra | Severidade | Condição |
|----|-------|-----------|----------|
| V-101 | Quantidade de pernas = 4 | Bloqueante | `legs.length != 4` |
| V-102 | Tipo de fundação selecionado por perna | Bloqueante | `leg.foundation == null` |
| V-103 | Cota Nc preenchida por perna | Bloqueante | `leg.Nc == null` |
| V-104 | Ncc preenchida | Bloqueante | `Ncc == null` |
| V-105 | Ângulo de deflexão dentro da faixa do projeto | Alerta | fora de faixa (faixa por tipo de torre — TODO confirmar) |
| V-106 | Stub compatível com fundação escolhida | Bloqueante | incompatibilidade no catálogo |
| V-107 | Afl ≥ mínimo do projeto | Alerta | `Afl < Afl_min` (Afl_min: TODO por tipo de torre) |
| V-108 | Fundação referencia item do catálogo do projeto | Bloqueante | `leg.foundation.catalogItemId` não existe no `ProjectFoundationCatalogItem` da obra |
| V-109 | Bitola existe na tabela de pesos | Bloqueante | `bitola ∉ {6.3, 8, 10, 12.5, 16, 20, 25, 32, 40}` mm |
| V-110 | Vol.Esc ≥ Vol.Conc por fundação | Alerta | volume de escavação < volume de concreto |
| V-111 | Parâmetros de cálculo do projeto preenchidos | Bloqueante | `ProjectCalculationParams` ausente na obra |

## 8. Cálculos (resumo; detalhes em `60_CALCULOS_E_FORMULARIOS.md`)

### Geometria e Topografia
- Bissetriz: `bis = deflexão / 2`
- Ângulos por perna: derivados da bissetriz e do alinhamento da LT.
- Afloramento por perna: `Afl_x = Ncc - Nc_x` (forma simplificada, L constante).
- Medida G: `G_x = Afl_x + dist_x` (distância horizontal projetada do PC ao centro da fundação).
- H total: `H = Ncc - NFC`; H subterrânea: `H_sub = Nc - NFC`.
- Desnível CC: `DesnCC = Cota_CC - 100.0` (Cota PC de referência).
- Distância diagonal: `√(X² + Y²)`.
- Ângulo inclinação: `arctan(Desnível / Distância)` em graus decimais.
- Profundidade fundação: `L - (Cota_CC - Cota_Base)`.

### Tabela de Pesos do Aço (Referência — RD-107)

| Bitola (mm) | Peso (kg/m) | Aço |
|-------------|-------------|-----|
| 6.3  | 0.245–0.252 | CA-60 |
| 8.0  | 0.395       | CA-50 |
| 10.0 | 0.628       | CA-50 |
| 12.5 | 0.963–1.00  | CA-50 |
| 16.0 | 1.60        | CA-50 |
| 20.0 | 2.50        | CA-50 |
| 25.0 | 4.00–4.07   | CA-50 |
| 32.0 | 6.313       | CA-50 |
| 40.0 | 9.865       | CA-50 |

### Armação — Bloco Ancorado em Rocha (BR)
```
// W e stirrupsBase vêm de ProjectCalculationParams (valores de referência: W=0.17126, base=14)
// stirrupSpacing vem de ProjectCalculationParams (valor de referência: 0.15m)

// POS N1 — fuste inclinado
C_fuste = √((G - 0.08)² + ((G - 0.08) × W)²) + 0.25

// POS N2 — estribos
Qtd_estribos = ((H - 1.35) / stirrupSpacing) + stirrupsBase
C_estribo    = ((Bloco_dim - 0.08) × 4) + 0.14          // perímetro menos cobrimento

// Afloramento de rocha
Afl_rocha = Cota_Topo - Cota_Base
```

### Armação — Tubulão a Céu Aberto (TCB)
```
// POS N1 — armadura vertical
C_N1 = Cota_Escavação + Desnível - 0.13                  // comprimento vertical menos cobrimento

// POS N2 — espiras helicoidais (stirrupsBase e stirrupSpacing do projeto)
Qtd_espiras = ROUND(((Comp - 1.1) / stirrupSpacing) + stirrupsBase, 0)
```

### Armação — Sapata (S / SES)
```
// POS N1 — armadura principal
C_N1 = √((Cota_Pé - Cota_Ref)² + ((Cota_Pé - Cota_Ref) × incl)²) + 0.20

// Estribos (stirrupsBase e stirrupSpacing do projeto)
Qtd_estribos = ROUND(((Comp - 1.35) / stirrupSpacing), 1) + stirrupsBase
```

### Pesos (comuns a todos os tipos)
```
C_total(N_x) = Qtd × C_unitário
P_total(N_x) = C_total × peso_por_metro(bitola)     // tabela acima
P_total_arm  = Σ P_total(N1..N4)
```

## 9. Fluxos

### 9.1 Fluxo Principal — Projetar Fundação Autoportante

**Fase 0 — Upload e configuração do projeto (uma vez por projeto):**
1. Fazer upload do arquivo de projeto (PDF/Excel).
2. Para cada tipo de fundação utilizado no projeto, informar:
   - Nome do tipo (ex.: `TCB`, `BR`, `S`)
   - Condição de solo (ex.: `normal`, `rochoso`, `mole`)
   - Tamanho: `I` | `II` | `III` | `IV` | `V` | `IA` | `IIA` | `IIIA` | `R` | `E`
   - Tipo de torre ao qual se aplica (ex.: `N5SSE`, `N5SL`)
3. Confirmar parâmetros de cálculo do projeto (`stirrupsBase`, `shaftInclinationTangent` W, `stirrupSpacing`).

**Fase 1 — Cadastro da torre:**
4. Selecionar torre: Nº/Circuito, Tipo, Extensão, Hu.
5. Informar ângulo de deflexão; inserir coordenadas UTM e vão de frente.
6. Inserir cotas Nc(A..D), Ncc e Cota CC por perna.

**Fase 2 — Seleção de fundação e cálculo:**
7. Para cada perna, selecionar o código de fundação do catálogo do projeto (ex.: `BR-N5SSE-VI`).
8. Para cada fundação, confirmar dimensões (L, D, d, H, Hs).
9. Definir stub por perna (tipo, locação Topo/Base).
10. Informar bitola por posição N1–N4.
11. Registrar equipamento de medição (Nº, certificado, vencimento).
12. Rodar motor de cálculo.
13. Visualizar resultados: ângulos, Afl, G, H, NFC, volumes, armação (qtd/comprimento/peso N1–N4).
14. Resolver validações; emitir formulários Form.ENG-*.

### 9.2 Fluxo Alternativo — Mistura de Tipos
Em **9.4**, usuário pode escolher `TCB` para A/B e `S` para C/D. O sistema carrega inputs específicos por tipo sem perder estado das demais pernas.

## 10. UI/UX — Requisitos (Angular v20+ + Tailwind)
- **Componente raiz**: `<tower-self-supporting-page>` (standalone, em `features/tower/`).
- 4 cards Tailwind (`grid-cols-2 lg:grid-cols-4`); cada card é `<leg-foundation-card>` (standalone).
- Estado por Signals: `tower = signal<TowerVM>()`, `legs = computed(() => tower().legs)`.
- Seletor de código de fundação por perna (combobox) com troca em runtime preservando demais pernas.
- Painel de armação expansível por perna: tabela N1–N4 com bitola, qtd, comp, peso.
- Indicadores visuais por perna: badges `bg-green-100 / bg-yellow-100 / bg-red-100`.
- Botões "Calcular tudo" / "Calcular esta perna".
- Persistência (autosave) via `effect()` → `LegService.save(...)`.
- Modo "rascunho" com banner no topo se houver dados incompletos.
- Acessibilidade WCAG 2.1 AA.

## 11. Módulos/Serviços (NestJS + Hexagonal)

- **Application Use Cases**:
  - `RegisterProjectFoundationCatalogUseCase` — cadastra os tipos de fundação definidos pelo usuário no upload
  - `SetProjectCalculationParamsUseCase` — define stirrupsBase, W, stirrupSpacing por projeto
  - `SelectFoundationForLegUseCase`
  - `RunLegCalculationUseCase`
  - `ComputeReinforcementUseCase`
- **Domain Services**:
  - `ReinforcementCalculator` — fuste, estribos, espiras, pesos (BR / TCB / S / SES); usa `ProjectCalculationParams`
  - `DepthCalculator` — Afl, G, H, NFC
- **Outbound Ports**:
  - `ProjectFoundationCatalogRepository.findByWorkAndCode(workId, code)`
  - `ProjectCalculationParamsRepository.findByWork(workId)`
  - `FoundationCalculatorPort.computeLeg(input: LegCalculationInput): LegCalculationResult`
- **Inbound Adapters**:
  - `LegController` (`PUT /api/v1/towers/{id}/legs/{legId}/foundation`)
  - `ProjectCatalogController` (`POST /api/v1/works/{id}/foundation-catalog`)
- **Outbound Adapters**:
  - `PostgresTowerRepositoryAdapter`
  - `PostgresLegRepositoryAdapter`
  - `PostgresProjectFoundationCatalogRepositoryAdapter`
- **TDD**:
  - `self-supporting-tower.spec.ts` (invariantes — 4 pernas).
  - `reinforcement-calculator.spec.ts` (BR fuste/estribos com params variáveis; TCB espiras).
  - `register-project-catalog.use-case.spec.ts` (tamanhos válidos I..E, tipos válidos).
  - `select-foundation-for-leg.use-case.spec.ts` (mock ports).
  - `leg-controller.e2e-spec.ts`.

## 12. Critérios de Aceitação
- **CA-101**: Torre com 4 pernas e tipos de fundação distintos por perna pode ser cadastrada.
- **CA-102**: Cálculo retorna Afl, G, H, NFC, volumes e armação (N1–N4 com pesos) por perna.
- **CA-103**: Mudar fundação em uma perna não invalida as demais.
- **CA-104**: Emissão bloqueada se qualquer perna tiver dado obrigatório ausente.
- **CA-105**: Armação com bitola fora da tabela (V-109) retorna erro bloqueante.
- **CA-106**: Fórmula de fuste BR usa `W` de `ProjectCalculationParams`; para G=3.0m, W=0.17126, resultado ≈ 3.44 m.
- **CA-107**: Usuário pode cadastrar tipo de fundação `TCB` com solo `normal`, tamanho `IV`, torre `N5SSE`; o catálogo fica acessível para seleção por perna.
- **CA-108**: Alterar `stirrupsBase` de 14 para 16 no projeto recalcula todas as fundações BR daquele projeto.
- **CA-109**: `towerNumber` e `id` (UUID) são campos distintos; busca por `towerNumber = "176/1"` retorna a torre correta.

## 13. TODO / Pendências
- Lista completa de tipos de torre autoportante com faixas de deflexão: TODO confirmar além de N5SSE / N5SA1 / N5SSL.
- Espaçamento de espiras para TCB (autoportante): TODO confirmar (estaiada usa 0.2m; autoportante pode diferir).
- Faixas numéricas de validações V-105 e V-107 (Afl_min por tipo): TODO.
- Catálogo oficial de stubs com dimensões e compatibilidade: TODO.
- Fórmula completa de armação para sapata (inclinação interna): TODO detalhar em `60_CALCULOS_E_FORMULARIOS.md`.
