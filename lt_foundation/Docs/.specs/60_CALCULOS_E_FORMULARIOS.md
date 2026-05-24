# 60 — Motor de Cálculo (Fórmulas, Ângulos, Locação, Volumes, Armação)

> Implementação: TypeScript puro em `domain/services/` (sem dependência de NestJS). Estratégia TDD obrigatória. Ver `05_ARCHITECTURE_AND_STACK.md`.

## 1. Objetivo
Especificar o **motor de cálculo** unificado: ângulos, bissetriz, locação topográfica, afloramento, profundidade, NFC, volumes (Tubulão / Sapata) e armação (Autoportante + Estaiada).

## 2. Escopo
**In scope**: cálculos geométricos, volumétricos e de armação. Aplica-se a autoportantes (por perna) e estaiadas (MC + estais).

**Out of scope**: dimensionamento estrutural detalhado.

## 3. Convenções
- Unidades: SI (metros, graus). Ângulos entram como `{deg, min, sec}` e são convertidos para decimais.
- Sentidos: deflexão com sufixo `D` (direita) ou `E` (esquerda).
- Cota PC = **100.0 m** (referência absoluta para todos os desníveis — RD-105).
- Tolerâncias numéricas: TODO confirmar com engenharia.

## 4. Constantes de Domínio

| Constante | Valor | Aplicação |
|-----------|-------|-----------|
| Cobrimento mínimo de concreto | **0.08 m** | Descontado nos comprimentos de armação (BR, TCB, S) |
| Acréscimo de ancoragem | **0.25 m** | Adicionado ao comprimento de armadura do fuste (BR) |
| Estribos fixos | **14** | Base fixa; independe da altura da fundação |
| Tangente de inclinação padrão (W) | **0.17126** | Cálculo de fuste inclinado (BR) |
| Cota PC | **100.0 m** | Referência de nivelamento para todos os desníveis |
| Espaçamento estribos (BR/blocos) | **0.15 m** | Cálculo de quantidade de estribos em blocos |
| Espaçamento espiras (tubulão estai) | **0.20 m** | Armação tubulão de estai |
| Tangente N5SEL | **0.7647** | Ângulo estai = 37°24'25'' |
| Tangente N5SEM | **0.7383** | Ângulo estai = 36°26'23'' |
| Embutimento haste (cabo) | **0.8 m** | Subtrai-se do comprimento calculado do cabo — porção embutida no bloco de ancoragem |
| Constante referência haste | **7 m** | Cálculo de inclinação da haste no terreno |
| Embutimento + folga haste | **0.8 + 0.5 m** | Comprimento total da haste |
| Elevação mastro padrão | **100.200 m** | Referência de cota do mastro central estaiado |

## 5. Tabela de Pesos do Aço

| Bitola (mm) | Peso (kg/m) | Tipo Aço |
|-------------|-------------|---------|
| 6.3  | 0.245–0.252 | CA-60 |
| 8.0  | 0.395       | CA-50 |
| 10.0 | 0.628       | CA-50 |
| 12.5 | 0.963–1.00  | CA-50 |
| 16.0 | 1.60–1.601  | CA-50 |
| 20.0 | 2.466–2.50  | CA-50 |
| 25.0 | 3.853–4.07  | CA-50 |
| 32.0 | 6.313       | CA-50 |
| 40.0 | 9.865       | CA-50 |

Regra: Ø = 6.3 mm → CA-60; Ø ≥ 8 mm → CA-50.

## 6. Inputs Consolidados

| Input | Origem | Tipo | Obrigatório |
|-------|--------|------|-------------|
| deflectionAngle | Projeto | `{deg, min, sec, dir}` | Sim |
| Hu | Catálogo/projeto | número (m) | Sim |
| towerType | Catálogo | 'N5SEL'\|'N5SEM'\|... | Sim |
| stayHorizAngle[A..D] | Projeto (estaiada) | `{deg, min, sec}` | Sim (EST) |
| theoreticalTable[A..D] | Tab. Alt. Torres via HLOOKUP | `StayTheoreticalLocation` | Não — seed (EST) |
| mastElevation | Survey (estaiada) | número (m) | Sim (EST) |
| P5[estai] | Survey (campo) | número (m) | Sim para correção alfa (EST) |
| XCC[estai] | Survey (campo) | número (m) | Sim para NCC/HC ajustados (EST) |
| Nc[pernas ou MC..estais] | Survey | número (m) | Sim |
| Ncc | Survey | número (m) | Sim |
| cotaCC | Survey | número (m) | Não (calculado/medido) |
| foundationCode | Usuário | string | Sim |
| foundationGeometry | Catálogo | objeto | Sim |
| stub | Catálogo/usuário | objeto | Sim |
| barDiameters[N1..N4] | Usuário (armação) | número[] (mm) | Sim para armação |
| excavationDepth | Survey/projeto | número (m) | Sim para armação tubulão |

## 7. Outputs Consolidados

| Output | Tipo | Origem |
|--------|------|--------|
| bisector | número (graus) | cálculo |
| legAngles[A..D] | número (graus) | cálculo |
| Afl[ponto] | número (m) | cálculo |
| G[ponto] | número (m) | cálculo |
| H[ponto] | número (m) | cálculo |
| H_sub[ponto] | número (m) | cálculo |
| NFC[ponto] | número (m) | cálculo |
| Vf, Vtc, Vb, VT, VE | número (m³) | cálculo (Tubulão) |
| V, VE | número (m³) | cálculo (Sapata) |
| stayTangent | número | tipo de torre → constante |
| alfa | número (rad) | cálculo: `arctan((cotaPF-P5)/4)` (Estaiada) |
| NCC_adjusted | número (m) | cálculo: `−tan(alfa)×XCC + cotaPF` (Estaiada) |
| HC_adjusted | número (m) | cálculo: `cotaPF − tan(alfa)×XCC` (Estaiada) |
| stayOffset | número (m) | cálculo (Estaiada) |
| realAnchorDist | número (m) | cálculo (Estaiada) |
| cableCutLength | número (m) | cálculo: `√((PC+DH-cotaPF)²+G²) − 0.8` (Estaiada) |
| rodAngle | número (graus) | cálculo (Estaiada) |
| rodCutLength | número (m) | cálculo (Estaiada) |
| reinforcement[N1..N4] | `{ qty, unitLen, totalLen, totalWeight }` | cálculo (Armação) |
| totalReinforcementWeight | número (kg) | cálculo |
| stayRadial_theoretical[A..D] | número (m) | tabela teórica (EST) |
| stayRadial_recalculated[A..D] | número (m) | cálculo com campo (EST) |
| locationStatus[estai] | `THEORETICAL\|RECALCULATED_WITH_FIELD` | sistema (EST) |

## 8. Conversão de Ângulos
```
toDecimalDeg(deg, min, sec) = deg + min/60 + sec/3600
toRadians(d)               = d × π / 180
toDMS(decimal)             = { deg: INT(decimal), min: INT(frac×60), sec: ROUND((frac×60 - INT(frac×60))×60, 2) }
```

## 9. Bissetriz e Ângulos das Pernas (Autoportante)
```
bis = toDecimalDeg(deflexão) / 2
```
Ângulos por perna A/B/C/D derivam do alinhamento da LT e da geometria do tipo de torre.
> Tabela de derivação por tipo de torre (N5SSE/N5SA1/N5SSL/...): TODO confirmar.

## 10. Geometria do Estai (Estaiada)

### 10.0 Tangente por Tipo de Torre
```
stayTangent(N5SEL) = 0.7647   // ângulo 37°24'25''
stayTangent(N5SEM) = 0.7383   // ângulo 36°26'23''
```

### 10.1 Distância Radial Teórica (seed — terreno plano)
```
// Fonte: Tab. Alt. Torres via HLOOKUP — jamais usar diretamente na Locação
R_teorico_x = Hu / tan(toRadians(stayAngle_x))
```
> Não deve ser usada como locação final quando dados de campo disponíveis (RN-209, RN-223).

### 10.2 Locação Recalculada com Dados de Campo
```
ΔNc_x    = Nc[MC] - Nc[estai_x]           // desnível MC → estai
R_calc_x = f(Hu, stayAngle_x, ΔNc_x,
              transversalAngle_x,
              longitudinalAngle_x)          // fórmula: TODO (ver §10.3)
```

### 10.3 Cálculo de Alfa — Inclinação do Terreno no PF
```
// P5 = cota medida a 5 m do PF em direção ao MC
// Resultado em radianos (usar em tan/arctan diretamente)
alfa = arctan((cotaPF - P5) / 4)
```

### 10.4 Correção por Terreno (Fundacao SM-VPM)
```
// NCC ajustado pela inclinação do terreno
NCC = -tan(alfa) × XCC + cotaPF

// HC — altura CC corrigida
HC = cotaPF - tan(alfa) × XCC

// XCC = distância horizontal do ponto MC ao ponto CC (m)
```

> Esses valores **substituem** os valores teóricos da Tab. Alt. Torres nas etapas de Locação e Conferência.

### 10.5 Cálculos de Locação do Ponto de Fincamento (Estaiada — com correção)
```
// ΔN — diferença de cota entre PF e ponto auxiliar
ΔN = cotaPF - Cota_Auxiliar

// Afastamento horizontal do mastro ao PF
Afastamento = (Elevação_Ponto_Fixação - cotaPF) × Tg_Estai

// Distância PF real = projeto + correção de terreno
Dist_PF_Real = Dist_Projeto + Afastamento

// Comprimento de corte do cabo de estai
// PC = Cota PC (100.0 m), DH = altura do ponto de fixação acima do PC
// G  = distância horizontal radial (Dist_PF_Real)
// 0.8 m = embutimento da haste no bloco de ancoragem (subtrai do cabo livre)
Comp_Cabo = √((PC + DH - cotaPF)² + G²) - 0.8

// Inclinação da haste com o terreno (7 = constante de referência)
Inc_Haste = arctan(7 / ΔCota) - Ângulo_Estai    // graus

// Distância do marco central ao PF (vetor)
Dist_Marco = √(Comp_X² + Comp_Y²)

// Comprimento de corte da haste (embutimento 0.8m + folga 0.5m)
Comp_Haste = √((Cota - 0.55)² + ((Cota - 0.55) × Tg)²) + 0.8 + 0.5

// Cota CC — somente VPME
Cota_CC = cotaPF - ((cotaPF - Cota_Projeto) / 5) × Fator
```

> **Nota sobre Comp_Cabo**: A fórmula do mapeamento real usa `(PC+DH-cotaPF)` e subtrai `0.8 m` (embutimento de haste), diferindo da forma simplificada `(Elevação - cotaPF) - 0.10` documentada anteriormente. O valor `PC+DH` corresponde à elevação do ponto de fixação do estai no mastro. A constante `0.8 m` é o embutimento da haste, NÃO a tolerância de montagem.

## 11. Alinhamento Estrutural, Afloramento, G, H, NFC

**Condição de alinhamento (RN-108):**
```
Nc[i] + Afl[i] + L[i] = constante
```

**Formas de cálculo:**
```
// Forma simplificada (L idêntico para todas as pernas)
Afl(ponto)    = Ncc - Nc(ponto)

// Forma geral (L variável)
Afl[i] = Afl_ref + (Nc_ref - Nc[i]) + (L_ref - L[i])

G(ponto)      = Afl(ponto) + dist(ponto)     // dist = horizontal PC → centro fundação (m)
H(ponto)      = Ncc - NFC(ponto)             // altura total da fundação (positiva)
H_sub(ponto)  = Nc(ponto) - NFC(ponto)       // componente subterrânea
NFC(ponto)    = Ncc - H(ponto)

// Topográfico
DesnCC        = Cota_CC - 100.0              // relativo ao Cota PC
DesnRef       = Cota_Ref - Cota_Referência
Prof_Fund     = L - (Cota_CC - Cota_Base)   // profundidade efetiva
Diag          = √(X² + Y²)                  // distância diagonal em planta
```

## 12. Volumes — Tubulão
```
Vf  = π × (D_f² / 4) × H_f
Vtc = (π × H_tc / 12) × (D_b² + D_b × D_f + D_f²)
Vb  = π × (D_b² / 4) × H_b
VT  = Vf + Vtc + Vb
VE  = VT × (1 + folga)                      // folga: TODO por tipo
```

## 13. Volumes — Sapata
```
V_sapata   = L × B × H_s
V_pedestal = (l_p × b_p × h_p) || 0         // apenas SPPM/SM
V          = V_sapata + V_pedestal
VE         = V × (1 + folga)

// Volume total de concreto estaiada (base + laje)
Vol_Total  = Vol_Concreto_Base + Vol_Concreto_Laje
```

## 14. Armação — Bloco Ancorado em Rocha (BR / BRM)

```
// POS N1 — fuste inclinado (W = 0.17126)
C_fuste = √((G - 0.08)² + ((G - 0.08) × 0.17126)²) + 0.25

// POS N2 — estribos (espaçamento 0.15m)
Qtd_estribos = ((H - 1.35) / 0.15) + 14
C_estribo    = ((Bloco_dim - 0.08) × 4) + 0.14          // perímetro - cobrimento

// Afloramento de rocha
Afl_rocha = Cota_Topo - Cota_Base
```

## 15. Armação — Tubulão a Céu Aberto (TCB / TSBM / TCBM / TSBE / TCBE)

```
// POS N1 — armadura vertical
C_N1 = Cota_Escavação + Desnível - 0.13                  // comprimento - cobrimento

// POS N2 — espiras helicoidais
// Autoportante: espaçamento conforme projeto (TODO)
// Estaiada: espaçamento 0.20m
Qtd_espiras = ROUND(((Comp - 1.1) / Esp) + 14, 0)        // Esp = 0.15 (auto) ou 0.20 (estai)

// Quantidade armação tubulão de estai (Dep. de profundidade de escavação)
Qtd_arm = ROUND(((Prof_Esc - 1.1) / 0.20) + 14, 0)
```

## 16. Armação — Sapata (S / SES / SPRM / SPPM)

```
// POS N1 — armadura principal (com inclinação)
C_N1 = √((Cota_Pé - Cota_Ref)² + ((Cota_Pé - Cota_Ref) × incl)²) + 0.20

// Estribos
Qtd_estribos = ROUND(((Comp - 1.35) / Esp), 1) + 14
```

## 17. Pesos de Armação (comuns a todos os tipos)

```
C_total(N_x)    = Qtd × C_unitário
P_total(N_x)    = C_total(N_x) × pesoM(bitola)      // tabela §5
P_total_arm     = Σ P_total(N1..N4)
```

## 18. Cantos S1..S4 — Sapata (planta)
Ver `41_FUNDACOES_SAPATA.md §8.2`.

## 19. Módulos/Serviços (Hexagonal + Clean Architecture)

### 19.1 Domain Services (`domain/services/`)
- `AngleService` — conversões (decimal↔DMS) e bissetriz.
- `LocationService` — PA1/PA2/PF e cotas (Survey).
- `DepthCalculator` — Afl, G, H, NFC.
- `CaissonVolumeCalculator` — volumes Tubulão (TCB/TSBM/TCBM/TSBE/TCBE).
- `FootingVolumeCalculator` — volumes Sapata (S/SES/SPRM/SPPM).
- `FootingLocationCalculator` — cantos S1..S4.
- `ReinforcementCalculator` — armação BR (fuste/estribos), TCB (vertical/espiras), Sapata.
- `StayGeometryService` — afastamento, Dist PF Real, comprimento corte cabo, inclinação haste.
- `SteelWeightTable` — lookup de peso por bitola.

### 19.2 Application Use Cases (`application/use-cases/`)
- `RunFoundationCalculationUseCase` — orquestra cálculos para uma torre.
- `ComputeReinforcementUseCase` — calcula armação por fundação.
- `ComputeStayCableUseCase` — calcula comprimento e especificação do cabo de estai.
- `ValidateDesignUseCase` — agrega validações pós-cálculo.

### 19.3 Ports (`application/ports/`)
- `FoundationCalculatorPort.compute(input: DesignInput): DesignOutput`.
- `FoundationCatalogRepository`.
- `SurveyRepository`.
- `SteelWeightTablePort` — consulta peso por bitola.

### 19.4 Estratégia TDD
- `caisson-volume-calculator.spec.ts` — `Vf = π·D_f²/4·H_f` para D_f=1, H_f=2 → ≈1.5708.
- `reinforcement-calculator.spec.ts`:
  - BR fuste: G=3.0, W=0.17126 → C_fuste ≈ 3.44m.
  - BR estribos: H=4.0 → Qtd = ((4.0-1.35)/0.15)+14 = 31.67 → 32 (ou sem arred.).
  - TCB espiras: Prof=5.0, Esp=0.2 → ROUND(((5.0-1.1)/0.2)+14, 0) = ROUND(33.5, 0) = 34.
- `stay-geometry.spec.ts`:
  - Afastamento N5SEL: Elev=100.2, CotaPF=98.5 → 1.7 × 0.7647 ≈ 1.30m.
  - Comprimento corte: Elev=100.2, CotaPF=98.5, DistPF=25.0 → √(1.7²+25²) - 0.10 ≈ 25.07m.
- `steel-weight-table.spec.ts` — bitola 16mm → 1.60 kg/m; bitola 6.3mm → 0.245 kg/m.
- `footing-volume-calculator.spec.ts` — V = L×B×H.
- Snapshot tests em `run-foundation-calculation.use-case.spec.ts`.

## 20. Critérios de Aceitação
- **CA-601**: Conjunto válido de inputs → todos os outputs sem erro.
- **CA-602**: Conversão de ângulos exata até 1e-6 graus decimais.
- **CA-603**: Volumes Tubulão: `VT = Vf + Vtc + Vb`.
- **CA-604**: Volumes Sapata: `V = V_sapata + V_pedestal`.
- **CA-605**: R_x estai (teórico) = `Hu / tan(stayAngle)`.
- **CA-606**: Motor falha com mensagem se input obrigatório ausente.
- **CA-607**: Inputs incompletos → `output.partial = true` e emissão bloqueada.
- **CA-608**: Bitola 16mm → peso 1.60 kg/m (tabela §5).
- **CA-609**: N5SEL → Tg = 0.7647; comprimento corte cabo com tolerância 0.10m subtraída.
- **CA-610**: Armação BR: fuste com G=3.0, W=0.17126 → resultado validado por teste unitário.
- **CA-611**: Qtd espiras tubulão estai com Prof=5.0 → 34 (espaçamento 0.20m).

## 21. TODO / Pendências
- Tabela de derivação de ângulos por perna para cada tipo de torre autoportante (N5SSE/N5SA1/N5SSL): TODO.
- Espaçamento de espiras para tubulão autoportante (TCB): TODO confirmar (estaiada usa 0.20m).
- Política de folga de escavação `(1 + folga)` por tipo de fundação: TODO.
- Tolerâncias numéricas oficiais: TODO.
- Fórmulas de recalculo de distância radial nos planos transversal e longitudinal (§10.2): TODO.
- Fator para cálculo de Cota CC da VPME (§10.3): TODO confirmar com engenharia.
- Tabela A/B/C/D/H/L por altura de torre (N5SEL/N5SEM): TODO.
