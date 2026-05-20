# 60 — Motor de Cálculo (Fórmulas, Ângulos, Locação, Volumes)

> Implementação: TypeScript puro em `domain/services/` (sem dependência de NestJS). Estratégia TDD obrigatória. Ver `05_ARCHITECTURE_AND_STACK.md`.

## 1. Objetivo
Especificar o **motor de cálculo** unificado: ângulos, bissetriz, locação topográfica, afloramento, profundidade, NFC e volumes (Tubulão/`CAISSON` e Sapata/`FOOTING`). Define inputs, outputs, fórmulas e critérios de aceitação.

## 2. Escopo
**In scope**: cálculos geométricos e volumétricos. Aplica-se a autoportantes (por perna) e estaiadas (MC + estais).

**Out of scope**: dimensionamento estrutural detalhado.

## 3. Convenções
- Unidades: SI (metros, graus). Ângulos podem entrar como `graus° minutos' segundos"` e ser convertidos internamente para decimais.
- Sentidos: deflexão com sufixo `D` (direita) ou `E` (esquerda) em relação ao alinhamento.
- Tolerâncias numéricas: **unknown** — TODO confirmar com engenharia.

## 4. Inputs Consolidados

| Input | Origem | Tipo | Obrigatório |
|-------|--------|------|-------------|
| deflectionAngle | Projeto | `{deg, min, sec, dir}` | Sim |
| Hu | Catálogo/projeto | número (m) | Sim |
| stayHorizAngle[A..D] | Projeto (estaiada) | `{deg, min, sec}` | Sim (EST) |
| stayInclinationAngle[A..D] | Projeto (estaiada) | número (graus) | Sim (EST) |
| Nc[A..D ou MC..D] | Survey | número (m) | Sim |
| Ncc | Survey | número (m) | Sim |
| foundationKind[perna/elemento] | Usuário | enum (Tubulão|Sapata) | Sim |
| foundationGeometry | Catálogo/projeto | objeto | Sim |
| stub | Catálogo/usuário | objeto | Sim |

## 5. Outputs Consolidados

| Output | Tipo | Origem |
|--------|------|--------|
| bisector | número (graus decimais) | cálculo |
| legAngles[A..D] / stayAngles[A..D] | número (graus) | cálculo |
| Afl[ponto] | número (m) | cálculo |
| G[ponto] | número (m) | cálculo |
| H[ponto] | número (m) | cálculo |
| NFC[ponto] | número (m) | cálculo |
| Vf, Vtc, Vb, VT, VE | número (m³) | cálculo (Tubulão) |
| V, VE | número (m³) | cálculo (Sapata) |
| corners S1..S4 | tuplas (x, y) | cálculo (Sapata) |
| stayRadial R[A..D] | número (m) | cálculo (Estaiada) |

## 6. Conversão de Ângulos
```
toDecimalDeg(deg, min, sec) = deg + min/60 + sec/3600
toRadians(d) = d * π / 180
```

## 7. Bissetriz e Ângulos das Pernas (Autoportante)
```
bis = toDecimalDeg(deflexao) / 2
```
Ângulos por perna A/B/C/D dependem do alinhamento da LT e da geometria padrão do tipo de torre.

> Detalhe: a regra exata de derivação por perna depende do tipo de torre (SL, SY, ...). **unknown** — TODO confirmar tabela.

## 8. Geometria do Estai (Estaiada)
```
R_x = Hu / tan( toRadians(incAngle_x) )    // distância radial do estai x ao MC
```
O ângulo horizontal do estai x define a posição angular em planta:
```
pos_x = (cos(θ_x) * R_x, sin(θ_x) * R_x)
```
onde `θ_x = toRadians(stayHorizAngle_x)`.

## 9. Afloramento, G, H, NFC
```
Afl(ponto)  = Nc(ponto) - Ncc
G(ponto)    = Afl(ponto) + dist(ponto)
H(ponto)    = soma das alturas da fundação naquele ponto
NFC(ponto)  = Ncc - H(ponto)
```

## 10. Volumes — Tubulão
```
Vf  = π * (D_f^2 / 4) * H_f
Vtc = (π * H_tc / 12) * (D_b^2 + D_b*D_f + D_f^2)
Vb  = π * (D_b^2 / 4) * H_b
VT  = Vf + Vtc + Vb
VE  = VT * (1 + folga)
```

## 11. Volumes — Sapata
```
V_sapata   = L * B * H_s
V_pedestal = (l_p * b_p * h_p) || 0
V          = V_sapata + V_pedestal
VE         = V * (1 + folga)
```

## 12. Cantos S1..S4 — Sapata (planta)
Ver `41_FUNDACOES_SAPATA.md` §8.2.

## 13. Módulos/Serviços (Hexagonal + Clean Architecture)

### 13.1 Domain Services (`domain/services/`)
- `AngleService` — conversões e bissetriz.
- `LocationService` — PA1/PA2/PF e cotas (Survey).
- `CaissonVolumeCalculator` (Tubulão).
- `FootingVolumeCalculator` (Sapata).
- `FootingLocationCalculator` (cantos S1..S4).
- `DepthCalculator` — Afl, G, H, NFC.
- `StayGeometryService` — R_x e posições dos estais.

### 13.2 Application Use Cases (`application/use-cases/`)
- `RunFoundationCalculationUseCase` — orquestra todos os cálculos para uma torre.
- `ValidateDesignUseCase` — agrega validações pós-cálculo.

### 13.3 Ports (`application/ports/`)
- `FoundationCalculatorPort.compute(input: DesignInput): DesignOutput`.
- `FoundationCatalogRepository`.
- `SurveyRepository`.

### 13.4 Estratégia TDD do Motor
- **Red**: criar `caisson-volume-calculator.spec.ts` com casos:
  - `Vf = π·D_f²/4·H_f` para `D_f=1, H_f=2 → Vf ≈ 1.5708`.
  - Erro para entradas ≤ 0.
- **Green**: implementar `CaissonVolumeCalculator.compute()`.
- **Refactor**: extrair helpers (`PI`, `circleArea`).
- Repetir para `FootingVolumeCalculator`, `FootingLocationCalculator`, `DepthCalculator`, `StayGeometryService`.
- Snapshot tests para `RunFoundationCalculationUseCase` com payloads de exemplo (torre 0/1 tipo SL).

## 14. Critérios de Aceitação

- **CA-601**: Dado um conjunto válido de inputs, o serviço retorna todos os outputs sem erro.
- **CA-602**: Conversão de ângulos é exata até 1e-6 graus decimais.
- **CA-603**: Volumes Tubulão atendem RN-402/403 (`VT = Vf+Vtc+Vb`).
- **CA-604**: Volumes Sapata atendem RN-412/413.
- **CA-605**: R_x do estai segue `R = Hu/tan(incAngle)`.
- **CA-606**: O motor falha (com mensagem) se algum input obrigatório está ausente.
- **CA-607**: Inputs marcados `unknown` resultam em `output.partial = true` e impedem emissão final.

## 15. TODO / Pendências
- Tabela exata de ângulos por tipo de torre autoportante: **unknown** — TODO.
- Política de folga de escavação por tipo de fundação: **unknown** — TODO.
- Tolerâncias numéricas oficiais: **unknown** — TODO.
