# 30 — Torres Estaiadas (`GuyedTower`)

> Frontend: Angular v20+ + Tailwind. Backend: NestJS módulo `tower-catalog` + `foundation-design`. Ver `05_ARCHITECTURE_AND_STACK.md`.

## 1. Objetivo
Especificar o subdomínio de torres **estaiadas**, compostas por **1 Mastro Central (MC)** + **4 Estais (A/B/C/D)**, onde cada elemento recebe um tipo de fundação do catálogo de acordo com as tabelas de tipos de torre (N5SEL / N5SEM — ver §4).

O sistema opera como um **pipeline de cálculo distribuído** entre planilhas interdependentes:

```
Tab. Alt. Torres        → parâmetros teóricos (ângulos, tangentes, alturas) via HLOOKUP
  ↓
Fundacao SM-VPM         → cálculos geométricos + correções por terreno (alfa, NCC, HC)
  ↓
Locação                 → posição final em campo (NUNCA usa valores teóricos diretamente)
  ↓
Conferência Final       → validação cruzada e emissão
```

A locação dos estais parte de **valores teóricos** (terreno plano, via Tab. Alt. Torres) e é **obrigatoriamente corrigida** pela inclinação real do terreno (`alfa`) antes de ser usada como locação final.

## 2. Escopo
**In scope**: cadastro, seleção de fundação por elemento (MC + 4 estais), cálculos (volumes + armação + corte de cabo + locação de haste), validações.

**Out of scope**: cálculo de tração do cabo; ver `20_AUTOPORTANTES.md` para autoportante.

## 3. Glossário
Ver `10_DOMAIN_OVERVIEW.md`. Termos exclusivos:

| Termo PT-BR | EN (código) | Definição |
|-------------|-------------|-----------|
| MC / Mastro Central | `centralMast` | Elemento vertical central que transmite carga axial. |
| Estai | `stay` | Cabo tracionado fixado em fundação radial ao MC. |
| Ponto de Fincamento | `anchorPoint` (PF) | Local no terreno onde o estai é ancorado. |
| Afastamento | `stayOffset` | Deslocamento horizontal calculado: `(Elev_PF - Cota_PF) × Tg`. |
| Distância PF Real | `realAnchorDistance` | `Distância de Projeto + Afastamento`. |
| Tangente do Estai | `stayTangent` | `tan(ângulo de inclinação)` — fixo por tipo de torre. |
| Cabo de Estai | `stayCable` | Cabo de aço galvanizado com diâmetro e carga de ruptura por tipo de torre. |
| Comprimento Corte | `cableLength` | Comprimento do cabo a ser cortado, com tolerância de 0.10 m. |
| Ponto Auxiliar (01/02) | `auxiliaryPoint` | Pontos de apoio para locação topográfica do MC. |
| Elevação Mastro | `mastElevation` | Cota de referência do mastro; padrão = 100.200 m. |
| HS | `topHeight` | Altura do ponto de fixação do estai no mastro acima do terreno. |
| HI | `instrumentHeight` | Altura do instrumento de medição. |
| Haste | `anchor rod` | Peça metálica que conecta o cabo ao bloco de fundação do estai. |
| alfa (α) | `terrainInclination` | Ângulo de inclinação do terreno no ponto de fincamento: `arctan((PF - P5) / 4)`. |
| P5 | `referencePoint5m` | Cota de referência a 5 m do PF, usada para calcular `alfa`. |
| XCC | `distanceToCC` | Distância horizontal do ponto MC ao ponto CC (ponto de ancoragem). |
| NCC ajustado | `adjustedNCC` | Nível CC corrigido pela inclinação do terreno: `NCC = −tan(α) × XCC + PF`. |
| HC | `correctedHeight` | Altura CC corrigida pelo terreno: `HC = PF − tan(α) × XCC`. |
| Valor Teórico | `theoreticalValue` | Valor oriundo da Tab. Alt. Torres (terreno plano); NUNCA usar como locação final. |
| Valor Ajustado | `terrainAdjustedValue` | Valor corrigido por `alfa`; este é o valor a usar na Locação e Conferência. |

## 4. Entidades de Domínio (DDD)

```
GuyedTower : Tower
├── id: TowerId                        // ex.: "105/1"
├── type: GuyedTowerType               // 'N5SEL' | 'N5SEM'
├── extension: number                  // altura útil Hu (m); valores: 25.5 a 49.5
├── deflectionAngle: Angle
├── centralMast: CentralMastElement
└── stays: [StayElement(A), StayElement(B), StayElement(C), StayElement(D)]

// Tipos de torre estaiada e suas constantes
GuyedTowerType
├── 'N5SEL' → stayTangent: 0.7647, stayAngle: {deg:37, min:24, sec:25}, cable: '1-1/8"', ruptureLoad: 70000 kgf
└── 'N5SEM' → stayTangent: 0.7383, stayAngle: {deg:36, min:26, sec:23}, cable: '1-1/4"', ruptureLoad: 88000 kgf

CentralMastElement
├── id: 'MC'
├── foundationCode: string             // ex.: "TCBM-N5SEL-I"
├── foundation: Foundation             // TSBM | TCBM | SPRM | SPPM | BRM | ESTM | ESTHM
├── elevation: number                  // elevação de referência (padrão 100.200 m)
├── surveyPoint: MastSurveyPoint
├── stub: StubData
├── reinforcement: Reinforcement
└── auxiliaryPoints: { aux01: AuxPoint, aux02: AuxPoint }

StayElement
├── id: 'A' | 'B' | 'C' | 'D'
├── foundationCode: string             // ex.: "TCBE-N5SEL-I"
├── foundation: Foundation             // TSBE | TCBE | VPME | ESTE | ESTHE
├── theoreticalLocation: StayTheoreticalLocation
├── surveyPoint: StaySurveyPoint
├── anchorPoint: AnchorPoint
├── cable: CableData
├── reinforcement: Reinforcement
└── locationStatus: 'THEORETICAL' | 'RECALCULATED_WITH_FIELD'

// Tabela teórica (seed — terreno perfeitamente nivelado):
StayTheoreticalLocation {
  A, B, C, D: number                  // distâncias horizontais teóricas (m)
  H: number                           // altura teórica do mastro
  L: number                           // comprimento teórico do estai
}

// Ponto de fincamento com dados de campo + correção por terreno:
AnchorPoint {
  cotaPF: number                      // cota do ponto de fincamento (medida)
  distProj: number                    // distância de projeto (m) — teórica (Tab. Alt. Torres)
  stayOffset: number                  // afastamento calculado (m)
  realDistance: number                // distância PF real = Dist_Proj + Afastamento

  // Correção por terreno (pipeline: Fundacao SM-VPM)
  P5: number                          // cota de referência a 5 m do PF
  alfa: number                        // inclinação do terreno (rad): arctan((cotaPF - P5) / 4)
  XCC: number                         // distância horizontal ao ponto CC (m)
  NCC: number                         // NCC ajustado: −tan(alfa)*XCC + cotaPF
  HC: number                          // altura CC ajustada: cotaPF − tan(alfa)*XCC

  cotaCC?: number                     // cota CC (apenas VPME)
  HI: number                          // altura do instrumento
  HS: number                          // altura do ponto de fixação
  DN: number                          // diferença de cota (ΔN)

  terrainAdjusted: boolean            // false = ainda usa valores teóricos; true = corrigido
}

CableData {
  diameter: string                    // ex.: '1-1/8"' | '1-1/4"' (por tipo de torre)
  ruptureLoad: number                 // kgf: 70000 (N5SEL) | 88000 (N5SEM)
  cutLength: number                   // m — comprimento a ser cortado
}

AuxPoint { HI: number; HS: number; DN: number; cota: number }

MastSurveyPoint { Nc: number; Ncc: number }
StaySurveyPoint  { Nc: number; Ncc: number; cotaPF: number; distRadial?: number }

// Fundações Mastro (código: {Tipo}-{TipoTorre}-{Tamanho})
FundacaoMastro  'TSBM' | 'TCBM' | 'SPRM' | 'SPPM' | 'BRM' | 'ESTM' | 'ESTHM'
// TSBM  = Tubulão Simples para Bloco de Mastro
// TCBM  = Tubulão com Base Alargada para Bloco de Mastro
// SPRM  = Sapata Piramidal para Radier de Mastro
// SPPM  = Sapata Piramidal com Placa para Mastro
// BRM   = Bloco de Rocha para Mastro
// ESTM  = Estaca Metálica para Mastro
// ESTHM = Estaca Hélice para Mastro

// Fundações Estai (código: {Tipo}-{TipoTorre}-{Tamanho})
FundacaoEstai   'TSBE' | 'TCBE' | 'VPME' | 'ESTE' | 'ESTHE'
// TSBE  = Tubulão Simples para Bloco de Estai
// TCBE  = Tubulão com Base Alargada para Bloco de Estai
// VPME  = Viga de Placa Metálica para Estai (solo firme)
// ESTE  = Estaca para Estai
// ESTHE = Estaca Hélice para Estai
```

## 5. Inputs vs Outputs

| Categoria | Input | Output |
|-----------|-------|--------|
| Identificação | Torre, tipo (N5SEL/N5SEM), extensão Hu | Identificador único |
| Geometria | Ângulo deflexão; ângulos horizontais 4 estais; ângulo inclinação por estai | Bissetriz; ângulos finalizados; tangente (fixo por tipo) |
| Tabela teórica | Tabela A/B/C/D/H/L (terreno plano) | `theoreticalLocation` por estai — seed inicial |
| Topografia MC | Nc/Ncc do MC; Elevação Mastro; Pontos Auxiliares 01/02 | Afl MC; NFC MC |
| Topografia Estais | Nc/Ncc, Cota PF, HI, HS, DN por estai | Afastamento; Dist PF real; Cota CC (VPME) |
| Seleção | Código de fundação por elemento (MC/Estai) | `Foundation` por elemento |
| Armação | Bitola por posição N1..N4 (profundidade de escavação) | Qtd, comprimentos, pesos; total kg |
| Cabo | Tipo de torre → cabo automático | Diâmetro, carga ruptura, comprimento corte |
| Haste | Cota terreno, tangente do estai | Comprimento corte haste, inclinação haste/terreno |

## 6. Regras de Negócio

### Estrutura
- **RN-201**: Toda torre estaiada possui **1 MC + exatamente 4 estais** (A, B, C, D).
- **RN-202**: Cada elemento (MC ou estai) referencia **uma** fundação do catálogo.
- **RN-203**: É permitido **misturar tipos** de fundação entre elementos.
- **RN-204**: A seleção de fundação por elemento é **obrigatória** antes do cálculo.
- **RN-205**: Ângulos horizontais dos estais somam 360° em torno do MC; sistema valida com tolerância.
- **RN-206**: Ângulo de inclinação do estai (Tg) é fixo por tipo de torre — não editável pelo usuário.
- **RN-207**: Locação topográfica (PA1/PA2/PF/Aux01/Aux02) registrada por elemento conforme Form.ENG-*.
- **RN-208**: Tabela A/B/C/D/H/L (Tab. Alt. Torres) é **TEÓRICA** (terreno plano) — alimentada via HLOOKUP; fornece `distProj`, ângulos e comprimentos iniciais. NÃO é locação final.
- **RN-209**: Dados de campo disponíveis → executar pipeline completo: calcular `alfa` → ajustar `NCC`/`HC` → recalcular distâncias radiais obrigatoriamente.
- **RN-210**: Cada MC com cota própria; locações dos estais calculadas por mastro de referência.
- **RN-211**: Recalculo considera desníveis transversal e longitudinal por mastro de referência, mais correção por `alfa`.
- **RN-212**: `locationStatus` = `THEORETICAL` (sem campo) ou `RECALCULATED_WITH_FIELD`. Emissão final exige `RECALCULATED_WITH_FIELD` se campo disponível.
- **RN-222**: `alfa` é calculado exclusivamente a partir de dados de campo (`P5` medido); nunca assumir `alfa = 0` (terreno plano) quando P5 disponível.
- **RN-223**: Locação (planilha) NUNCA pode usar `distProj` teórico diretamente — deve usar `realDistance` (já corrigida por terreno e afastamento).
- **RN-224**: A Tab. Alt. Torres é fonte primária de ângulos e tangentes via HLOOKUP; recalculo NÃO substitui essa tabela — usa a base teórica + correções por terreno.

### Tipos de Torre e Constantes de Estai
- **RN-213**: A **tangente do estai** e o **ângulo** são determinados pelo tipo de torre:
  - `N5SEL`: Tg = **0.7647**, ângulo = **37°24'25''**
  - `N5SEM`: Tg = **0.7383**, ângulo = **36°26'23''**
- **RN-214**: O **cabo de estai** é definido pelo tipo de torre:
  - `N5SEL`: Ø **1 1/8''** (Carga Ruptura: **70.000 kgf**)
  - `N5SEM`: Ø **1 1/4''** (Carga Ruptura: **88.000 kgf**)
- **RN-215**: Tolerância de montagem: subtrair **0.10 m** do comprimento calculado do cabo.
- **RN-216**: Constante de referência para inclinação de haste = **7 m**.
- **RN-217**: Elevação Mastro padrão = **100.200 m**.

### Cálculos Específicos
- **RN-218**: Quantidade de armação tubulão (estai): `ROUND(((Prof_Esc - 1.1) / 0.2) + 14, 0)` — espaçamento 0.2 m.
- **RN-219**: Vol.Esc ≥ Vol.Conc por elemento (escavação deve conter o concreto).
- **RN-220**: Volume total de concreto = Vol_Concreto_Base + Vol_Concreto_Laje.
- **RN-221**: Cota CC para fundação VPME: `Cota_CC = Cota_PF - ((Cota_PF - Cota_Projeto) / 5) × Fator`.

## 7. Validações

| ID | Regra | Severidade | Condição |
|----|-------|-----------|----------|
| V-201 | 1 MC presente | Bloqueante | `centralMast == null` |
| V-202 | Exatamente 4 estais com IDs A,B,C,D | Bloqueante | `stays.length != 4 \|\| IDs duplicados` |
| V-203 | Tipo de fundação por elemento | Bloqueante | qualquer elemento sem fundação |
| V-204 | Ângulos horizontais somam 360° (tolerância) | Alerta | desvio > tolerância (TODO confirmar) |
| V-205 | Ângulo de inclinação coerente com tipo de torre | Bloqueante | `Tg != f(TipoTorre)` — RN-213 |
| V-206 | Cotas Nc preenchidas para todos os elementos | Bloqueante | Nc ausente em MC ou estai |
| V-207 | Distância radial compatível com inclinação e Hu | Alerta | inconsistência geométrica |
| V-208 | Stub compatível com fundação por elemento | Bloqueante | incompatibilidade no catálogo |
| V-209 | Locação final não pode ser teórica quando campo disponível | Bloqueante | `locationStatus == THEORETICAL && fieldDataPresent` |
| V-210 | Todos os estais com `RECALCULATED_WITH_FIELD` antes de emitir | Bloqueante | qualquer `locationStatus == THEORETICAL && fieldDataPresent` |
| V-211 | Comprimento de corte de cabo > 0 | Bloqueante | `cableLength <= 0` |
| V-212 | Cota > 0 em todos os pontos | Bloqueante | `cota <= 0` em qualquer ponto |
| V-213 | Tipo de torre IN (N5SEL, N5SEM) | Bloqueante | tipo de torre não reconhecido |
| V-214 | Vol.Esc ≥ Vol.Conc | Alerta | `volEsc < volConc` — RN-219 |
| V-215 | Certificado do equipamento de medição válido | Alerta | `certificateExpiry < today` |
| V-216 | Fundação existe no projeto/catálogo | Bloqueante | VLOOKUP não retorna valor (fundação não cadastrada) |

## 8. Cálculos (detalhes em `60_CALCULOS_E_FORMULARIOS.md`)

### Constantes por Tipo de Torre

| Torre | Tg Estai | Ângulo Estai | Cabo | Carga Ruptura |
|-------|----------|--------------|------|---------------|
| N5SEL | 0.7647 | 37°24'25'' | Ø 1-1/8'' aço galvanizado | 70.000 kgf |
| N5SEM | 0.7383 | 36°26'23'' | Ø 1-1/4'' aço galvanizado | 88.000 kgf |

### Pipeline de Cálculo — Estai (sequência obrigatória)

```
// PASSO 1 — Valor teórico (Tab. Alt. Torres via HLOOKUP)
distProj = HLOOKUP(tipoTorre, tabAltTorres, linha_A_B_C_D)   // distância teórica (m)

// PASSO 2 — Inclinação do terreno no PF
alfa = arctan((cotaPF - P5) / 4)                              // P5 = cota a 5 m do PF

// PASSO 3 — Correção por terreno (Fundacao SM-VPM)
NCC = -tan(alfa) × XCC + cotaPF
HC  = cotaPF - tan(alfa) × XCC

// PASSO 4 — Afastamento e distância real
ΔN           = cotaPF - Cota_Auxiliar
Afastamento  = (Elev_Ponto_Fixação - cotaPF) × Tg_Estai
Dist_PF_Real = Dist_Projeto + Afastamento

// PASSO 5 — Comprimento do cabo (fórmula com embutimento da haste)
// PC = cota PC (100.0 m), DH = altura do ponto de fixação acima do PC
Comp_Cabo = √((PC + DH - cotaPF)² + G²) - 0.8
// G = distância horizontal radial ao PF
// 0.8 m subtraído = embutimento da haste no bloco de ancoragem
```

> **Atenção**: os valores `NCC` e `HC` obtidos com `alfa` SUBSTITUEM os valores teóricos nas etapas de Locação e Conferência. Nunca usar `NCC_teórico` como entrada final.

### Inclinação da Haste com o Terreno
```
// 7 = constante de referência (m) — RN-216
Inc_Haste = arctan(7 / ΔCota) - Ângulo_Estai    // resultado em graus
```

### Distância do Marco Central ao PF
```
Dist_Marco = √(Componente_A² + Componente_B²)    // módulo do vetor posição
```

### Comprimento de Corte da Haste
```
// Embutimento 0.8m + folga 0.5m
C_Haste = √((Cota - 0.55)² + ((Cota - 0.55) × Tg)²) + 0.8 + 0.5
```

### Armação do Tubulão (Estai)
```
// Espaçamento 0.2m para tubulões de estai (RN-218)
Qtd_arm = ROUND(((Prof_Escavação - 1.1) / 0.2) + 14, 0)
```

### Cota CC — Somente VPME (RN-221)
```
Cota_CC = Cota_PF - ((Cota_PF - Cota_Projeto) / 5) × Fator
```

### Volume de Concreto Total (RN-220)
```
Vol_Total = Vol_Concreto_Base + Vol_Concreto_Laje
```

### Bissetriz e Locação
- Bissetriz: `bis = deflexão / 2`.
- Distância radial **teórica** (seed): `R_teorico = Hu / tan(incAngle)` — somente terreno plano.
- Distância radial **recalculada**: corrigir desnível transversal/longitudinal (ver `60_CALCULOS_E_FORMULARIOS.md §8.1`).
- Status: `THEORETICAL` → `RECALCULATED_WITH_FIELD`.

## 9. Fluxos

### 9.1 Principal — Projetar Fundação Estaiada

**Etapa 1 — Tab. Alt. Torres (fonte teórica):**
1. Selecionar torre estaiada (tipo N5SEL/N5SEM, extensão Hu).
2. Sistema carrega via HLOOKUP da Tab. Alt. Torres: ângulos, tangentes, distâncias A/B/C/D, alturas H e comprimentos L → `theoreticalLocation`. Status = `THEORETICAL`.
3. Informar ângulo de deflexão; verificar ângulos horizontais dos 4 estais.

**Etapa 2 — Fundacao SM-VPM (cálculos geométricos + correção por terreno):**
4. Para MC e cada estai, selecionar código de fundação do catálogo.
5. Selecionar dimensão; definir stubs e armação por elemento.
6. Inserir Nc/Ncc por MC; registrar Pontos Auxiliares 01/02.
7. Inserir Cota PF, P5, HI, HS, DN por estai.
8. Sistema calcula: `alfa` → `NCC` → `HC` → Afastamento → `Dist_PF_Real` → `Comp_Cabo` (RN-209, RN-222).
9. Rodar motor com valores ajustados por terreno → rascunho com dados corrigidos.

**Etapa 3 — Locação (posição final em campo):**
10. Sistema usa exclusivamente `Dist_PF_Real` (jamais `distProj` teórico) e `NCC`/`HC` ajustados (RN-223).
11. Status → `RECALCULATED_WITH_FIELD` para cada estai com `P5` informado.

**Etapa 4 — Conferência Final:**
12. Validar inconsistências: `alfa` fora do limite (V-029), `PF` inválido (V-030), cabo negativo (V-031).
13. Resolver alertas; validar bloqueantes; emitir Form.ENG-106/107/128/195.

### 9.2 Mistura de Tipos
MC = SPRM; Estai A = TCBE; Estai B = VPME. O sistema mantém estado por elemento.

## 10. UI/UX — Requisitos (Angular v20+ + Tailwind)
- **Componente raiz**: `<tower-guyed-page>` (standalone).
- Layout: card destacado do MC (centro) + 4 cards radiais (A/B/C/D).
- Componente `<guyed-element-card>` reutilizável (standalone).
- Painel topográfico: PF / Aux01 / Aux02 / cotas / Afastamento / Dist Real.
- Painel de cabo: diâmetro automático por tipo de torre, comp corte calculado.
- Painel de armação: N1–N4 com profundidade, qtd, peso.
- Badge visual de `locationStatus` por estai: THEORETICAL (amarelo) / RECALCULATED_WITH_FIELD (verde).
- Signals: `tower = signal<GuyedTowerVM>()`.
- Acessibilidade WCAG 2.1 AA.

## 11. Módulos/Serviços (NestJS + Hexagonal)
- **Application Use Cases**:
  - `SelectFoundationForElementUseCase`
  - `RunGuyedTowerCalculationUseCase`
  - `ComputeStayCableLengthUseCase`
- **Domain Services**:
  - `StayGeometryService` — afastamento, Dist PF real, comprimento corte, inclinação haste.
  - `ReinforcementCalculator` — armação por tipo de fundação de estai.
- **Outbound Ports**: `FoundationCatalogRepository`, `FoundationCalculatorPort`, `SurveyRepository`.
- **Inbound Adapter**: `GuyedController`.
- **TDD**:
  - `guyed-tower.spec.ts` (invariantes: 1 MC + 4 estais únicos).
  - `stay-geometry.spec.ts` (afastamento, comprimento corte, inclinação haste).
  - `cable-selector.spec.ts` (N5SEL → 1-1/8''; N5SEM → 1-1/4'').
  - `select-foundation-for-element.use-case.spec.ts`.

## 12. Critérios de Aceitação
- **CA-201**: Torre estaiada com MC + 4 estais e tipos de fundação distintos pode ser cadastrada.
- **CA-202**: Cálculo retorna Afl, Dist Radial, H, NFC, volumes e armação por elemento.
- **CA-203**: Trocar fundação de um estai não invalida demais elementos.
- **CA-204**: Emissão bloqueada se qualquer elemento sem dado obrigatório.
- **CA-205**: Torre N5SEL → cabo 1-1/8'', Tg=0.7647 automaticamente.
- **CA-206**: Torre N5SEM → cabo 1-1/4'', Tg=0.7383 automaticamente.
- **CA-207**: Comprimento corte = `√((Elev-CotaPF)²+(DistPF)²) - 0.10` verificado por teste unitário.
- **CA-208**: Status muda de `THEORETICAL` para `RECALCULATED_WITH_FIELD` ao inserir dados de campo.

## 13. TODO / Pendências
- Tabela A/B/C/D/H/L oficial por tipo e altura de torre (N5SEL/N5SEM): TODO extrair do banco de projeto (fonte: Tab. Alt. Torres; carregada via HLOOKUP).
- Ângulos transversal e longitudinal por estai para recalculo de distância radial (§10.2 de `60`): TODO.
- Fórmulas de correção de desnível transversal/longitudinal (`60_CALCULOS_E_FORMULARIOS.md §10.2`): TODO.
- Fator para cálculo de Cota CC da VPME (RN-221): TODO confirmar com engenharia.
- Tolerância de desvio de ângulos horizontais (V-204): TODO.
- Dimensões completas do catálogo VPME (L, C, H por tamanho): TODO — ver `55_CATALOGO_FUNDACOES.md`.
- Política de simetria dos estais por tipo de torre: TODO confirmar.
- `alfa_max` — limite de inclinação do terreno aceitável (V-029): TODO confirmar com engenharia.
- Definição precisa de `DH` na fórmula do cabo (`Comp_Cabo = √((PC+DH-cotaPF)²+G²) − 0.8`): confirmar se `PC+DH = Elev_Ponto_Fixação` ou se há offset adicional.
- Confirmar que `0.8 m` na fórmula do cabo corresponde apenas ao embutimento da haste (e não inclui tolerância de montagem adicional).
