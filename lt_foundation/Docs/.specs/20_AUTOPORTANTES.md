# 20 — Torres Autoportantes (`SelfSupportingTower`)

> Frontend: Angular v20+ + Tailwind. Backend: NestJS módulo `tower-catalog` + `foundation-design`. Ver `05_ARCHITECTURE_AND_STACK.md`.

## 1. Objetivo
Especificar o subdomínio de torres **autoportantes**, com 4 pernas (A/B/C/D), onde cada perna pode receber um tipo de fundação distinto (Tubulão/`CAISSON` ou Sapata/`FOOTING`).

## 2. Escopo
**In scope**: cadastro, seleção de fundação por perna, cálculos, locação por perna, volumes, validações.

**Out of scope**: torre estaiada (ver `30_ESTAIADAS.md`); cálculo estrutural da torre.

## 3. Glossário
Ver `10_DOMAIN_OVERVIEW.md`. Termos exclusivos desta spec:
- **Perna A/B/C/D**: posicionamento padrão sentido horário a partir do alinhamento da LT.

## 4. Entidades de Domínio (DDD)

```
SelfSupportingTower : Tower
└── legs: [Leg(A), Leg(B), Leg(C), Leg(D)]

Leg
├── id: 'A'|'B'|'C'|'D'
├── foundation: Foundation (Tubulão | Sapata)
├── surveyPoint: { Nc, Ncc, distToCenter }
├── stub: { type, length, embedment, inclination }
└── derived: { Afl, G, H, NFC, volumes, locationPoints }
```

## 5. Inputs vs Outputs

| Categoria | Input | Output |
|-----------|-------|--------|
| Identificação | Torre (ex.: 0/1), Tipo (ex.: SL), Extensão (6), Hu (21 m) | Identificador único da torre |
| Geometria horizontal | Ângulo de deflexão (60°19'54" D) | Bissetriz; ângulos por perna |
| Topografia | Cotas Nc(A), Nc(B), Nc(C), Nc(D); Ncc | Afl por perna; G por perna |
| Seleção | Tipo de fundação por perna (Tubulão/Sapata) | `Foundation` por perna |
| Geometria fundação | Dimensões (do banco de fundações) | Volumes, profundidade H, NFC |
| Stub | Tipo, comprimento, ângulo | Locação do stub na fundação |

## 6. Regras de Negócio

- **RN-101**: Toda torre autoportante deve possuir **exatamente** 4 pernas A, B, C, D.
- **RN-102**: Cada perna referencia **uma** fundação. A escolha é do usuário.
- **RN-103**: É permitido **misturar tipos** de fundação entre pernas (ex.: A/B Tubulão; C/D Sapata).
- **RN-104**: A seleção de fundação por perna é **obrigatória** antes de rodar o motor de cálculo.
- **RN-105**: Ângulos de cada perna são derivados do ângulo de deflexão e da bissetriz; nunca são editados manualmente (apenas exibidos).
- **RN-106**: O afloramento (Afl) é específico de cada perna pois Nc varia por ponto.
- **RN-107**: A emissão final só ocorre após todas as 4 pernas terem cálculos válidos.

## 7. Validações

| ID | Regra | Severidade | Condição |
|----|-------|-----------|----------|
| V-101 | Quantidade de pernas = 4 | Bloqueante | `legs.length != 4` |
| V-102 | Tipo de fundação selecionado por perna | Bloqueante | `leg.foundation == null` |
| V-103 | Cota Nc preenchida por perna | Bloqueante | `leg.Nc == null` |
| V-104 | Ncc (cota de concretagem) preenchida | Bloqueante | `Ncc == null` |
| V-105 | Ângulo de deflexão dentro de faixa do projeto | Alerta | fora de faixa (faixa: **unknown** — TODO) |
| V-106 | Stub compatível com fundação escolhida | Bloqueante | incompatibilidade do catálogo |
| V-107 | Afl ≥ mínimo do projeto | Alerta | `Afl < Afl_min` (Afl_min: **unknown** — TODO) |

## 8. Cálculos (resumo; detalhes em `60_CALCULOS_E_FORMULARIOS.md`)

- Bissetriz: `bis = deflexao / 2`.
- Ângulos por perna: derivados da bissetriz e do alinhamento da LT.
- Afloramento por perna: `Afl_x = Nc_x - Ncc`, onde `x ∈ {A,B,C,D}`.
- Medida G: `G_x = Afl_x + dist_x` (`dist_x` = distância do ponto até a fundação).
- Profundidade: `H = (NFC - Ncc) + Afl` (forma geral; ajustar por tipo).
- Volumes: dependem do tipo de fundação (ver specs 40/41).

## 9. Fluxos

### 9.1 Fluxo Principal — Projetar Fundação Autoportante
1. Selecionar torre e tipo (SL/SY/etc., extensão, Hu).
2. Informar ângulo de deflexão.
3. Inserir cotas Nc(A..D) e Ncc.
4. Para cada perna, selecionar tipo de fundação (Tubulão | Sapata).
5. Para cada fundação, selecionar dimensão no banco de fundações.
6. Definir stub por perna.
7. Rodar motor de cálculo.
8. Visualizar resultados (ângulos, Afl, G, H, NFC, volumes, locação).
9. Validar; resolver bloqueios.
10. Emitir planilha.

### 9.2 Fluxo Alternativo — Mistura de Tipos
- Em **9.4**, usuário pode escolher Tubulão para A/B e Sapata para C/D. O sistema deve carregar inputs específicos por tipo, sem perda de estado.

## 10. UI/UX — Requisitos (Angular v20+ + Tailwind)
- **Componente raiz**: `<tower-self-supporting-page>` (standalone, em `features/tower/`).
- 4 cards Tailwind (grid `grid-cols-2 lg:grid-cols-4`); cada card é `<leg-foundation-card>` (standalone).
- Estado por Signals: `tower = signal<TowerVM>()`, `legs = computed(() => tower().legs)`.
- Seletor de tipo de fundação por perna (combobox) com troca em runtime preservando dados gerais.
- Indicadores visuais de validação por perna: badges `bg-green-100 / bg-yellow-100 / bg-red-100`.
- Botões "Calcular tudo" / "Calcular esta perna".
- Persistência (autosave) por perna via `effect()` chamando `LegService.save(...)`.
- Modo "rascunho" se houver `unknown` — banner Tailwind no topo.
- Acessibilidade WCAG 2.1 AA (foco visível, contraste, ARIA).

## 11. Módulos/Serviços (NestJS + Hexagonal)

- **Application Use Cases**:
  - `SelectFoundationForLegUseCase`
  - `RunLegCalculationUseCase` (parte de `RunFoundationCalculationUseCase`)
- **Domain**: `SelfSupportingTower`, `Leg`, política `MixedFoundationPolicy` (permite tipos distintos por perna).
- **Outbound Ports**:
  - `FoundationCatalogRepository.findByKind(kind: FoundationKind)`
  - `FoundationCalculatorPort.computeLeg(input: LegCalculationInput): LegCalculationResult`
- **Inbound Adapters**:
  - `LegController` (`PUT /api/v1/towers/{id}/legs/{legId}/foundation`)
- **Outbound Adapters**:
  - `PostgresTowerRepositoryAdapter`
  - `PostgresLegRepositoryAdapter`
- **TDD**:
  - `self-supporting-tower.spec.ts` (entity invariants — 4 pernas).
  - `select-foundation-for-leg.use-case.spec.ts` (mock ports).
  - `leg-controller.e2e-spec.ts`.

## 12. Critérios de Aceitação
- **CA-101**: É possível registrar uma torre com 4 pernas e tipos de fundação distintos por perna.
- **CA-102**: O cálculo retorna Afl, G, H, NFC e volumes por perna.
- **CA-103**: Mudar o tipo de fundação em uma perna não invalida as demais.
- **CA-104**: Emissão é bloqueada se qualquer perna tiver `unknown`.

## 13. TODO / Pendências
- Faixas de validação numéricas: **unknown** — TODO.
- Lista de tipos válidos de torre autoportante: **unknown** — TODO.
- Catálogo oficial de stubs: **unknown** — TODO.
