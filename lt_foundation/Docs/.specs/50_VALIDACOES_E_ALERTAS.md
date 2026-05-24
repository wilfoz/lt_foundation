# 50 — Validações e Alertas (Catálogo Global)

## 1. Objetivo
Consolidar o catálogo global de **validações** e **alertas** aplicáveis ao sistema, com severidades, agrupamentos e critérios de emissão da planilha.

## 2. Escopo
**In scope**: regras transversais e referência cruzada às specs 20/30/40/41.

**Out of scope**: regras locais já cobertas por suas specs (apenas referenciadas aqui).

## 3. Severidades

| Severidade | Comportamento |
|------------|---------------|
| Bloqueante | Impede emissão final. Permite somente rascunho. |
| Alerta | Permite emissão; aparece destacado em UI e planilha. |
| Informativa | Apenas log/auditoria. |

## 4. Validações Globais

| ID | Categoria | Regra | Severidade |
|----|-----------|-------|-----------|
| V-001 | Identidade | Torre tem `id`, `tipo`, `extensão`, `Hu` | Bloqueante |
| V-002 | Classificação | Torre é `SELF_SUPPORTING` ou `GUYED` | Bloqueante |
| V-003 | Estrutura AP | 4 pernas A/B/C/D | Bloqueante |
| V-004 | Estrutura EST | 1 MC + exatamente 4 estais A/B/C/D | Bloqueante |
| V-005 | Seleção | Cada perna/elemento tem fundação selecionada | Bloqueante |
| V-006 | Inputs | Todos os inputs obrigatórios preenchidos | Bloqueante |
| V-007 | Inputs | Inputs marcados `unknown` exigem TODO | Alerta |
| V-008 | Topografia | Cotas Nc e Ncc preenchidas | Bloqueante |
| V-009 | Geometria | Ângulo de deflexão presente | Bloqueante |
| V-010 | Geometria | Bissetriz coerente com deflexão | Informativa (auto-derivada) |
| V-011 | Stub | Stub selecionado por perna/elemento | Bloqueante |
| V-012 | Catálogo | Fundação existe no catálogo de projeto (VLOOKUP retorna valor) | Bloqueante |
| V-013 | Mistura | Mistura de tipos permitida — sem erro, somente nota | Informativa |
| V-014 | Volumes | VT (Tubulão) ou V (Sapata) > 0 | Bloqueante |
| V-015 | Afloramento | Afl ≥ Afl_min (Afl_min: **unknown** — TODO por tipo de torre) | Alerta |
| V-016 | Emissão | Não emite se há `V-###` Bloqueante ativa | Bloqueante (sistema) |
| V-017 | Auditoria | Mudanças no design ficam logadas | Informativa |
| V-018 | Locação EST | Distâncias teóricas não podem ser locação final quando campo disponível (RN-209) | Bloqueante |
| V-019 | Locação EST | Todos os estais `RECALCULATED_WITH_FIELD` antes da emissão final, se campo disponível (RN-212) | Bloqueante |
| V-020 | Locação EST | Ângulo de inclinação consistente com projeto por estai (tolerância: **unknown** — TODO) | Alerta |
| V-021 | Locação EST | MC sem `mastRef` definido bloqueia cálculo (RN-210) | Bloqueante |
| V-022 | Topografia | Cota > 0 em todos os pontos topográficos medidos | Bloqueante |
| V-023 | Volumes | Vol.Esc ≥ Vol.Conc por fundação | Alerta |
| V-024 | Armação AP | Bitola da barra deve existir na tabela mestre (6.3–40.0 mm) | Bloqueante |
| V-025 | Equipamento | Equipamento de medição com certificado de calibração válido | Alerta |
| V-026 | EST — Tipo | Tipo de torre estaiada IN (N5SEL, N5SEM) — outros tipos: TODO catalogar | Bloqueante |
| V-027 | EST — Cabo | Comprimento de corte do cabo de estai > 0 | Bloqueante |
| V-028 | EST — Tangente | Tangente do estai coerente com tipo de torre (RN-213) | Bloqueante |
| V-029 | EST — Terreno | `alfa` fora do limite aceitável — inclinação do terreno excessiva (`\|alfa\| > alfa_max`; limite: TODO confirmar com engenharia) | Alerta |
| V-030 | EST — PF | `cotaPF` inválida: nula, negativa, ou inconsistente com a elevação do mastro (cotaPF ≥ mastElevation) | Bloqueante |
| V-031 | EST — Cabo | Comprimento calculado do cabo ≤ 0 após correção por terreno: `Comp_Cabo = √((PC+DH-cotaPF)²+G²) − 0.8 ≤ 0` | Bloqueante |

## 5. Validações Cruzadas

| ID | Regra | Severidade |
|----|-------|-----------|
| V-101..110 | Ver `20_AUTOPORTANTES.md` §7 | — |
| V-201..216 | Ver `30_ESTAIADAS.md` §7 | — |
| V-401..406 | Ver `40_FUNDACOES_TUBULAO.md` §7 | — |
| V-411..416 | Ver `41_FUNDACOES_SAPATA.md` §7 | — |
| V-501..510 | Ver `55_CATALOGO_FUNDACOES.md` §9 | — |

## 6. Política de Alertas Visuais

- Cards por perna/elemento exibem badge:
  - **Verde**: todas validações passam.
  - **Amarelo**: existe Alerta.
  - **Vermelho**: existe Bloqueante.
- Tooltips listam IDs de validação ativos.

## 7. Política de Emissão

- **Rascunho**: gerado a qualquer momento; marca d'água "RASCUNHO".
- **Final**: somente quando todas as validações bloqueantes estão resolvidas. Marca d'água ausente; assinatura digital opcional.

## 8. Critérios de Aceitação

- **CA-501**: Catálogo de validações é único e referenciado por IDs estáveis.
- **CA-502**: UI e API expõem o mesmo conjunto de validações.
- **CA-503**: Toda emissão final passa por `ValidateDesignService.assertEmissionAllowed()`.

## 9. TODO / Pendências
- Limites numéricos (faixas) por validação de severidade alerta: **unknown** — TODO.
- Política de assinatura digital: **unknown** — TODO.
- V-029: `alfa_max` (graus) — limite de inclinação do terreno aceitável para fundação estaiada: TODO confirmar com engenharia.
- V-030: critério exato de inconsistência de cotaPF vs alturas do mastro: TODO confirmar com levantamento.
- V-031: comportamento quando `G = 0` (estai colinear com mastro): TODO definir mensagem de erro.
