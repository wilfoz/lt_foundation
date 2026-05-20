# 30 — Torres Estaiadas (`GuyedTower`)

> Frontend: Angular v20+ + Tailwind. Backend: NestJS módulo `tower-catalog` + `foundation-design`. Ver `05_ARCHITECTURE_AND_STACK.md`.

## 1. Objetivo
Especificar o subdomínio de torres **estaiadas**, compostas por **Mastro Central (`CentralMast`/MC)** + **4 Estais (`Stay` A/B/C/D)**, onde cada elemento pode receber um tipo de fundação distinto (Tubulão/`CAISSON` ou Sapata/`FOOTING`).

## 2. Escopo
**In scope**: cadastro, seleção de fundação por elemento (MC + 4 estais), cálculos, locação (PF/PA/ângulos/alturas), volumes, validações.

**Out of scope**: cálculo de tração do cabo do estai; ver `20_AUTOPORTANTES.md` para autoportante.

## 3. Glossário
Ver `10_DOMAIN_OVERVIEW.md`. Termos exclusivos:
- **MC**: Mastro Central. Recebe carga vertical principal.
- **Estai**: Cabo tracionado fixado em fundação radial.
- **Ângulo de inclinação do estai**: ângulo do cabo em relação ao plano horizontal.

## 4. Entidades de Domínio (DDD)

```
GuyedTower : Tower
├── centralMast: Element { id:'MC', foundation, surveyPoint, stub }
└── stays: [ Element('A'..'D') ]
     ├── id: 'A'|'B'|'C'|'D'
     ├── foundation: Foundation (Tubulão|Sapata)
     ├── surveyPoint: { Nc, Ncc, PF, PF-1, PF+3, distRadial }
     ├── stayGeometry: { incAngle, horizAngle, length }
     └── stub: StubData
```

## 5. Inputs vs Outputs

| Categoria | Input | Output |
|-----------|-------|--------|
| Identificação | Torre, tipo, extensão, Hu | Identificador único |
| Geometria | Ângulo de deflexão; ângulos horizontais dos 4 estais; ângulo de inclinação por estai | Bissetriz; ângulos finalizados |
| Topografia | Cotas Nc nos 5 pontos (MC + 4 estais); PF/PA1/PA2/PF-1/PF+3 | Afl por elemento; distâncias radiais |
| Seleção | Tipo de fundação por elemento (MC e cada estai) | `Foundation` por elemento |
| Geometria fundação | Dimensão do banco de fundações por elemento | Volumes; H; NFC |
| Stub | Tipo, comprimento por elemento | Locação na fundação |

## 6. Regras de Negócio

- **RN-201**: Toda torre estaiada possui exatamente 1 MC + 4 estais (A, B, C, D).
- **RN-202**: Cada elemento (MC ou estai) referencia **uma** fundação.
- **RN-203**: É permitido **misturar tipos** de fundação entre elementos (ex.: MC Sapata; estais Tubulão).
- **RN-204**: A seleção de fundação por elemento é **obrigatória** antes de calcular.
- **RN-205**: Os ângulos horizontais dos estais somam 360° em torno do MC; sistema deve permitir personalização (estais simétricos ou não).
- **RN-206**: O ângulo de inclinação do estai impacta o cálculo da posição radial da fundação do estai em relação ao MC.
- **RN-207**: A locação topográfica (PA1/PA2/PF/PF-1/PF+3) deve ser registrada para cada elemento, conforme o documento de locação anexo.

## 7. Validações

| ID | Regra | Severidade | Condição |
|----|-------|-----------|----------|
| V-201 | Exatamente 1 MC | Bloqueante | `centralMast == null` |
| V-202 | Exatamente 4 estais com IDs A,B,C,D | Bloqueante | tamanho ≠ 4 ou IDs duplicados |
| V-203 | Tipo de fundação por elemento | Bloqueante | qualquer elemento sem fundação |
| V-204 | Ângulos horizontais somam 360° (tolerância) | Alerta | desvio > tolerância (tolerância: **unknown** — TODO) |
| V-205 | Ângulo de inclinação em faixa válida | Bloqueante | fora de faixa (faixa: **unknown** — TODO) |
| V-206 | Cotas Nc preenchidas para todos os 5 pontos | Bloqueante | Nc ausente em qualquer ponto |
| V-207 | Distância radial do estai compatível com inclinação e Hu | Alerta | inconsistência geométrica |
| V-208 | Stub compatível com fundação por elemento | Bloqueante | catálogo |

## 8. Cálculos (resumo; detalhes em `60_CALCULOS_E_FORMULARIOS.md`)

- Bissetriz idem autoportante.
- Distância radial do estai: `R = Hu / tan(incAngle)` (forma geral, ajustar por projeto).
- Afl por elemento: `Afl = Nc - Ncc` (por ponto).
- H, NFC, volumes: ver specs 40 (Tubulão) e 41 (Sapata).
- Locação topográfica: alinhamento via PA1/PA2; deslocamentos PF, PF-1, PF+3.

## 9. Fluxos

### 9.1 Principal — Projetar Fundação Estaiada
1. Selecionar torre estaiada.
2. Informar Hu, ângulo de deflexão.
3. Definir ângulos horizontais dos 4 estais.
4. Definir ângulo de inclinação por estai.
5. Inserir Nc nos 5 pontos + Ncc.
6. Para o MC e para cada estai, selecionar tipo de fundação.
7. Selecionar dimensão da fundação (banco).
8. Definir stubs.
9. Rodar motor; revisar.
10. Emitir planilha.

### 9.2 Mistura de Tipos
- Exemplo: MC = Sapata; Estai A = Tubulão; Estai B = Sapata; etc. O sistema mantém estado por elemento.

## 10. UI/UX — Requisitos (Angular v20+ + Tailwind)
- **Componente raiz**: `<tower-guyed-page>` (standalone).
- Layout Tailwind: card destacado do MC (centro) + 4 cards radiais (A/B/C/D).
- Componente `<guyed-element-card>` reutilizável (standalone).
- Painel topográfico `<survey-panel>` exibindo PF/PA1/PA2/PF-1/PF+3 e cotas.
- Visualização esquemática (SVG inline) opcional dos 4 estais e ângulos.
- Signals: `tower = signal<GuyedTowerVM>()`, `elements = computed(...)`.
- Validação visual por elemento via badges Tailwind.
- Acessibilidade WCAG 2.1 AA.

## 11. Módulos/Serviços (NestJS + Hexagonal)
- **Application Use Cases**:
  - `SelectFoundationForElementUseCase`
  - `RunGuyedTowerCalculationUseCase`
- **Domain**: `GuyedTower`, `TowerElement`, `CentralMast`, `Stay`, políticas `MixedFoundationPolicy` e `StayGeometryPolicy`.
- **Outbound Ports**: `FoundationCatalogRepository`, `FoundationCalculatorPort`, `SurveyRepository`.
- **Inbound Adapter**: `GuyedController`.
- **TDD**:
  - `guyed-tower.spec.ts` (invariantes: 1 MC + 4 estais únicos).
  - `stay-geometry.spec.ts` (R = Hu/tan(inc)).
  - `select-foundation-for-element.use-case.spec.ts`.

## 12. Critérios de Aceitação
- **CA-201**: É possível registrar torre estaiada com MC + 4 estais e tipos de fundação distintos por elemento.
- **CA-202**: Cálculo retorna Afl, R (distância radial), H, NFC e volumes por elemento.
- **CA-203**: Trocar o tipo de fundação de um estai não invalida os demais nem o MC.
- **CA-204**: Emissão bloqueada se qualquer elemento tiver `unknown`.

## 13. TODO / Pendências
- Faixas de inclinação válidas: **unknown** — TODO.
- Catálogo de fundações para MC (banco): **unknown** — TODO completar.
- Catálogo de fundações para estais (banco): **unknown** — TODO completar.
- Política de simetria dos estais: **unknown** — TODO confirmar.
