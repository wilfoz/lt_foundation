# ADR-001: Avaliação de Coerência — Specs vs MAPEAMENTO das Planilhas Reais

**Status:** Accepted (findings + ações)
**Data:** 2026-05-24
**Contexto:** Cruzamento das specs do sistema LT Foundation com o `MAPEAMENTO_ANALISE v1.0` das planilhas reais de fundações para estruturas estaiadas do projeto *LT 230kV SE VENTOS DA BAHIA 3 — SE VENTOS DA BAHIA 2* (ELECNOR BRASIL).

---

## Resumo Executivo

O MAPEAMENTO confirma as decisões centrais de design tomadas nas specs. No entanto, expõe **4 gaps estruturais** e **6 gaps menores** que exigem ações antes da implementação.

---

## 1. Itens CONFIRMADOS pelo MAPEAMENTO

| Ponto verificado | Spec | Status |
|---|---|---|
| H = Hu + 0.7 (altura total) | spec 30, 60 | ✅ |
| 1 MC + 4 estais (A, B, C, D) por torre | spec 30 | ✅ |
| alfa = arctan((cotaPF − P5) / 4) | spec 30 §10.3, 60 §10.3 | ✅ |
| NCC = −tan(α) × XCC + cotaPF | spec 30, 60 §10.4 | ✅ |
| HC = cotaPF − tan(α) × XCC | spec 30, 60 §10.4 | ✅ |
| Comp_Cabo = √((PC+DH−cotaPF)² + G²) − 0.8 | spec 60 §10.5 | ✅ |
| Tabela de pesos do aço (NBR 7480) | spec 55 §6, 60 §5 | ✅ |
| hc = (H − 0.9) / 2 | spec 60 | ✅ |
| Tab. Alt. Torres → entidade `HEIGHT_FORMATION` | spec 25 §9.2 | ✅ |
| BD FUND → catálogo de fundações por obra | spec 55, RN-224 | ✅ |
| Tower number format "105/1" como string | spec 30 TowerId | ✅ |
| Constantes (W, stirrupsBase, cobrimento) extraídas de docs | spec 25 RN-222 | ✅ |
| Nomenclatura de fundações varia por obra | spec 25 RN-224, spec 55 | ✅ |

**Decisão de design VALIDADA — por-obra:** O MAPEAMENTO usa `VL`, `TRM`, `TRE`, `SPM`, `TM`, `EHE` enquanto os documentos FD anteriores usavam `TB`, `TBE`. São dois projetos distintos com vocabulários diferentes. A decisão de RN-224 (catálogo por obra, sem enum global) está **correta**.

---

## 2. Gaps CRÍTICOS (bloqueiam implementação correta)

### GAP-1 — Entidade `Trecho` não existe no modelo de domínio

**Evidência no MAPEAMENTO:**
```
Hierarquia: LT → Trecho (LT1, LT2, LT3, LT4) → Torre
Seletor: "SELECIONAR TRECHO 1, 2, 3, 4 (LT1-LT4)"
Intervalos nomeados: DADOSLT1, DADOSLT2, DADOSLT3, DADOSLT4
```

**Problema nas specs:** Todas as specs modelam `Obra → Torre` diretamente, sem nível intermediário. O TOWER_LIST schema (spec 25 §9.7) não tem coluna `trecho`. A entidade `WorkTower` (spec 15) não tem campo `trecho`.

**Impacto:** Sem `Trecho`, é impossível filtrar torres por seção da LT, o que é operação cotidiana (o operador seleciona trecho antes de trabalhar com a torre).

**Ação:** Adicionar entidade `WorkTrecho` (ou campo `trecho: string` em `WorkTower`) na spec 15. Adicionar coluna opcional `trecho` / `lt_section` na spec 25 §9.7 (TOWER_LIST).

---

### GAP-2 — Posições de armadura: N1-N4 nas specs vs N1-N6 (MC) e P1-P7 (estais) na realidade

**Evidência no MAPEAMENTO:**
```
Posições Armadura MC:    N1 a N6  (6 posições)
Posições Armadura Estai: P1 a P7  (7 posições)
```

**Problema nas specs:**
- Spec 55 `ReinforcementSpec` usa `position: 'N1' | 'N2' | 'N3' | 'N4'` (hardcoded, 4 posições).
- Spec 60 `reinforcement[N1..N4]` igualmente limitado.

**Impacto:** Armação MC com 6 posições não cabe no modelo atual. Armação de estai tem posições com identificador diferente (P, não N).

**Ação:**
- Refatorar `ReinforcementSpec.position` para `string` (ex.: `'N1'`–`'N6'` ou `'P1'`–`'P7'`).
- Separar lógica de armação do MC (N1-N6) e dos estais (P1-P7) no modelo.
- Atualizar spec 55 §5 e spec 60 §6/§7.

---

### GAP-3 — Volume de Reaterro não está na geometria do catálogo de fundação

**Evidência no MAPEAMENTO:**
```
1.4 FUNDAÇÃO: Volumes: Escavação (m³), Concreto (m³), Reaterro (m³)
Planilhas dedicadas: Cont. Reat.-VPM, Cont. Reat.TM-VPM, Cont. Reat.-EHE
```

**Problema nas specs:** `TubulaoGeometry` e `SapataGeometry` (spec 55 §5) têm `volumeExcavation` e `volumeConcrete`, mas **não `volumeBackfill` (reaterro)**. O reaterro é um volume rastreado separadamente nas planilhas e é saída esperada do motor de cálculo.

**Impacto:** O relatório de emissão não conseguirá calcular o volume de reaterro = Escavação − Concreto − ajustes, e os registros de campo (Cont. Reat.) não têm entidade correspondente.

**Ação:**
- Adicionar `volumeBackfill?: number` em `TubulaoGeometry`, `SapataGeometry`, `VPMEGeometry` (spec 55 §5).
- Adicionar output `volumeBackfill` em spec 60 §7.
- Fórmula: `V_reat = V_escavação − V_concreto − ajuste_vala` (confirmar com engenharia).

---

### GAP-4 — Constantes geométricas da torre (A, B, D, PA) não estão no schema `TOWER_HEIGHT`

**Evidência no MAPEAMENTO:**
```
Constantes por tipo de torre (VBEL):
  Lateral Transversal A  = 9.423 m  → Tab. Alt. Torres
  Lateral Longitudinal B = 9.823 m  → Tab. Alt. Torres
  Altura Fixação Estai D = 18.9 m   → Tab. Alt. Torres
  Distância PA (long)    = 1.8 m    → Tab. Alt. Torres
  Distância PA (transv)  = 0 m      → Tab. Alt. Torres

Usadas nas fórmulas:
  E = √((A+PA)² + (B+PA)²)   → Diagonal PF
  L = √(E² + D²)             → Comprimento teórico estai
```

**Problema nas specs:** O `TowerHeightParsedData` (spec 25 §9.2) extrai `extensionVariants[]`, `mastStayLocationTable[]` e `foundationLocationTable[]`, mas **não extrai A, B, D, PA** como constantes geométricas do tipo de torre. Essas constantes vêm da Tab. Alt. Torres (= documento HEIGHT_FORMATION) e são necessárias para calcular a diagonal PF e o comprimento do estai.

O `PROJECT_CONSTANTS` schema (spec 25 §9.6) cobre apenas constantes de cálculo de concreto/armação (W, stirrupsBase, cobrimento). As constantes **geométricas de torre** são uma categoria separada e não estão em nenhum schema.

**Impacto:** Sem A, B, D, PA no domínio, o motor de cálculo (spec 60) não consegue calcular a diagonal PF nem o comprimento teórico do estai sem que esses valores sejam hardcoded ou inseridos manualmente.

**Ação:**
- Adicionar campo `towerGeometryConstants` ao `TowerHeightParsedData` (spec 25 §9.2):
```ts
towerGeometryConstants: {
  lateralTransversal_A: number;    // m — lateral transversal
  lateralLongitudinal_B: number;   // m — lateral longitudinal
  stayFixationHeight_D: number;    // m — altura de fixação do estai
  anchorOffset_PA_long: number;    // m — deslocamento ponto ancoragem longitudinal
  anchorOffset_PA_transv: number;  // m — deslocamento ponto ancoragem transversal
  heightDiff_dif: number;          // m — diferença fixação-H (tipico 0.9)
  concreteSurface_DH: number;      // m — afloramento do concreto (tipico 0.3)
}
```
- Criar entidade de domínio `TowerGeometryParams` no bounded context `tower-catalog` para armazenar essas constantes por tipo de torre.
- Adicionar esses inputs ao spec 60 §6 (Inputs Consolidados).

---

## 3. Gaps IMPORTANTES (não bloqueiam mas impactam qualidade)

### GAP-5 — H1 = H − DH não está nomeado como variável de output

**Evidência:** `H1 = H − DH` é calculada em `Fundacao SM-VPM` e usada em formulas subsequentes.
**Ação:** Adicionar `H1` como output nomeado no spec 60 §7. Fórmula: `H1 = (Hu + 0.7) − DH`.

---

### GAP-6 — NFC (Nível Fundo Cava) é output implícito, não nomeado

**Evidência:** MAPEAMENTO lista `NCC, NFC, HC` como profundidades separadas da fundação. Specs modelam NCC e HC mas não NFC explicitamente.
**Ação:** Adicionar `NFC` em spec 60 §7. Fórmula presumida: `NFC = NCC − HC` (confirmar).

---

### GAP-7 — XCC não tem fórmula documentada nas specs

**Evidência no MAPEAMENTO:**
```
XCC = cos(α) × (cos(α) × AB + tan(α) × ...) com projeções de terreno
```
**Problema:** Spec 30 tem `XCC` como campo de input em `AnchorPoint`, mas spec 60 não define como calculá-lo — trata como dado de campo. O MAPEAMENTO mostra que XCC é parcialmente calculado (não apenas medido).
**Ação:** Documentar no spec 60 §10.4 ou §10.5 a fórmula completa de XCC com os parâmetros envolvidos (AB, alfa). Marcar como TODO confirmar com engenharia.

---

### GAP-8 — Constantes do Comp_Haste (AF, AG, 0.06) são por projeto, não estão em PROJECT_CONSTANTS

**Evidência no MAPEAMENTO:**
```
L = √(XCC² + H'²) + AF + 0.06 − AG
```
Spec 60 §10.5 usa `+ 0.8 + 0.5` fixos para embutimento/folga. Os valores AF, AG, 0.06 diferem.
**Ação:** Adicionar `rodEmbedmentAF`, `rodAdjustmentAG` ao schema PROJECT_CONSTANTS (spec 25 §9.6). O valor 0.06 provavelmente é constante de norma — confirmar.

---

### GAP-9 — Tipo BST não está documentado em nenhuma spec

**Evidência:** `MID(tipo,1,3) = 'BST'` exclui cálculo de XCC (mesma regra do EHE).
**Ação:** Identificar o que é BST (provável "Bloco de Solo com Tirante" ou similar) e documentar como tipo de fundação no catálogo da obra. Marcar como TODO.

---

### GAP-10 — Controles de Reaterro e Regeneração não têm entidade de domínio

**Evidência:** 6 planilhas de controle (Cont. Reat., Cont. Regen.) rastreiam execução de campo — amostras de compactação, solo-cimento.
**Status:** Provavelmente fora do escopo atual do sistema (spec 25 out-of-scope menciona apenas "cálculo de fundações"). Mas representa dados coletados em campo que podem alimentar o sistema.
**Ação:** Decidir se controle de reaterro/regeneração entra no bounded context `survey` ou fica fora do escopo. Documentar a decisão.

---

## 4. Checklist de Ações por Spec

| Spec | Ação | Prioridade |
|---|---|---|
| **spec 15 (OBRA)** | Adicionar `WorkTrecho` ou campo `trecho` em `WorkTower` | 🔴 Alta |
| **spec 25 §9.2** | Adicionar `towerGeometryConstants` ao `TowerHeightParsedData` | 🔴 Alta |
| **spec 25 §9.6** | Adicionar `rodEmbedmentAF`, `rodAdjustmentAG` ao PROJECT_CONSTANTS | 🟡 Média |
| **spec 25 §9.7** | Adicionar coluna opcional `trecho` / `lt_section` ao TOWER_LIST | 🔴 Alta |
| **spec 55 §5** | Refatorar `position: 'N1'\|...\|'N4'` → `position: string` | 🔴 Alta |
| **spec 55 §5** | Adicionar `volumeBackfill` em todas as geometrias | 🔴 Alta |
| **spec 55 §13** | Adicionar `TowerGeometryParams` como nova entidade do tower-catalog | 🔴 Alta |
| **spec 60 §6** | Adicionar A, B, D, PA como inputs do motor de cálculo | 🔴 Alta |
| **spec 60 §7** | Adicionar outputs: `H1`, `NFC`, `volumeBackfill` | 🟡 Média |
| **spec 60 §10.4** | Documentar fórmula completa de XCC | 🟡 Média |
| **spec 60 §10.5** | Revisar constantes da haste (AF, AG vs 0.8+0.5) | 🟡 Média |
| **spec 00** | Registrar BST e SPM como tipos conhecidos (exemplos) | 🟢 Baixa |

---

## 5. Decisão Arquitetural: `TowerGeometryParams` como entidade de domínio

**Contexto:** As constantes A, B, D, PA, DH, dif variam por tipo de torre e são extraídas da Tab. Alt. Torres (documento HEIGHT_FORMATION). São usadas por todo o motor de cálculo de estaiadas.

**Decisão:** Criar entidade `TowerGeometryParams` no bounded context `tower-catalog`, vinculada ao tipo de torre. Populada via aprovação humana do `ParsedRecord(TOWER_HEIGHT)` do documento HEIGHT_FORMATION.

```ts
class TowerGeometryParams {
  towerType: string;                   // ex.: "VBEL", "N5SEL"
  workId: WorkId;                      // por obra (nomenclatura pode variar)
  lateralTransversal_A: number;        // m
  lateralLongitudinal_B: number;       // m
  stayFixationHeight_D: number;        // m
  anchorOffset_PA_longitudinal: number; // m
  anchorOffset_PA_transversal: number;  // m
  heightDiff_dif: number;              // m (diferença fixação-H; tipico 0.9)
  concreteSurface_DH: number;          // m (afloramento; tipico 0.3)
  stayCableDiameter: string;           // ex.: '5/8"', '1-1/8"'
}
```

**Consequência:** O motor de cálculo (spec 60) busca `TowerGeometryParams` por `{workId, towerType}` no início de qualquer cálculo de estaiada, em vez de ter esses valores hardcoded ou inseridos manualmente.

---

## 6. O que NÃO muda

- Bounded contexts e módulos NestJS — estrutura correta.
- Pipeline de ingestão (spec 25) — fluxo correto; apenas schemas a expandir.
- Validação humana obrigatória (spec 35, RN-207) — confirmada pelo fluxo da planilha (W12='S').
- Catálogo por obra (RN-224) — fortemente validado.
- Fórmulas geométricas principais (alfa, NCC, HC, Comp_Cabo) — corretas.
- Tabela de pesos NBR 7480 — correta.
