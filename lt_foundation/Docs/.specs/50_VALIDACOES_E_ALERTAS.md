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
| V-004 | Estrutura EST | 1 MC + 4 estais A/B/C/D | Bloqueante |
| V-005 | Seleção | Cada perna/elemento tem fundação selecionada | Bloqueante |
| V-006 | Inputs | Todos os inputs obrigatórios preenchidos | Bloqueante |
| V-007 | Inputs | Inputs marcados `unknown` exigem TODO | Alerta |
| V-008 | Topografia | Cotas Nc e Ncc preenchidas | Bloqueante |
| V-009 | Geometria | Ângulo de deflexão presente | Bloqueante |
| V-010 | Geometria | Bissetriz coerente com deflexão | Informativa (auto-derivada) |
| V-011 | Stub | Stub selecionado por perna/elemento | Bloqueante |
| V-012 | Catálogo | Dimensões da fundação existem no banco | Alerta (se overridden) |
| V-013 | Mistura | Mistura de tipos permitida — sem erro, somente nota | Informativa |
| V-014 | Volumes | VT (Tubulão) ou V (Sapata) > 0 | Bloqueante |
| V-015 | Afloramento | Afl ≥ Afl_min (Afl_min: **unknown** — TODO) | Alerta |
| V-016 | Emissão | Não emite se há `V-###` Bloqueante ativa | Bloqueante (sistema) |
| V-017 | Auditoria | Mudanças no design ficam logadas | Informativa |

## 5. Validações Cruzadas

| ID | Regra | Severidade |
|----|-------|-----------|
| V-101..107 | Ver `20_AUTOPORTANTES.md` §7 | — |
| V-201..208 | Ver `30_ESTAIADAS.md` §7 | — |
| V-401..406 | Ver `40_FUNDACOES_TUBULAO.md` §7 | — |
| V-411..416 | Ver `41_FUNDACOES_SAPATA.md` §7 | — |

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
