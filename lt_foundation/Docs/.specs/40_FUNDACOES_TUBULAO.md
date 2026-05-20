# 40 — Fundação Tipo Tubulão (`CaissonFoundation`)

> Código: `kind = 'CAISSON'`. Classe: `CaissonFoundation`. Calculator: `CaissonVolumeCalculator`. Ver `05_ARCHITECTURE_AND_STACK.md`.

## 1. Objetivo
Especificar a fundação tipo **Tubulão**, aplicável tanto a torres autoportantes (por perna) quanto estaiadas (por elemento: MC ou estais).

## 2. Escopo
**In scope**: geometria, inputs, locação (eixo), cálculos de volume (Vf, Vtc, Vb, VT, VE), profundidade, afloramento, armação/stub, validações específicas.

**Out of scope**: dimensionamento estrutural do concreto (resistência, armaduras finas).

## 3. Glossário
- **Vf**: Volume do fuste.
- **Vtc**: Volume do tronco de cone (transição fuste→base).
- **Vb**: Volume da base alargada.
- **VT**: Volume total de concreto (`Vf + Vtc + Vb`).
- **VE**: Volume de escavação.
- **D_f**: Diâmetro do fuste.
- **D_b**: Diâmetro da base.
- **H_f**: Altura do fuste.
- **H_tc**: Altura do tronco de cone.
- **H_b**: Altura da base.

## 4. Entidades de Domínio (TypeScript)

```ts
class CaissonFoundation extends Foundation {
  readonly kind = 'CAISSON' as const;
  geometry: {
    shaftDiameter: number;     // D_f
    baseDiameter: number;      // D_b
    shaftHeight: number;       // H_f
    frustumHeight: number;     // H_tc
    baseHeight: number;        // H_b
  };
  reinforcement?: Reinforcement;            // unknown — TODO
  depth: { totalDepth: number; concreteBottomLevel: number; protrusion: number }; // H, NFC, Afl
  volumes: {
    shaftVolume: number;       // Vf
    frustumVolume: number;     // Vtc
    baseVolume: number;        // Vb
    totalVolume: number;       // VT
    excavationVolume: number;  // VE
  };
}
```

## 5. Inputs vs Outputs

| Input (obrigatório) | Tipo | Output |
|---------------------|------|--------|
| D_f (diâmetro do fuste) | número (m) | Vf |
| D_b (diâmetro da base) | número (m) | Vb |
| H_f (altura do fuste) | número (m) | Vf |
| H_tc (altura tronco de cone) | número (m) | Vtc |
| H_b (altura da base) | número (m) | Vb |
| Nc (cota natural) | número (m) | Afl |
| Ncc (cota de concretagem) | número (m) | Afl, NFC |
| Stub (tipo, comprimento, embutimento, inclinação) | objeto | Posição do stub |

## 6. Regras de Negócio

- **RN-401**: O Tubulão é eixo-simétrico; a locação é definida pelo eixo central (não há S1..S4 como na sapata).
- **RN-402**: Volume total `VT = Vf + Vtc + Vb`.
- **RN-403**: Volume de escavação `VE` considera o volume total + sobrelargura (folga lateral) conforme projeto.
- **RN-404**: O afloramento `Afl = Nc - Ncc` é específico ao ponto do Tubulão.
- **RN-405**: A profundidade `H` inclui da cota de concretagem até o fundo da base.
- **RN-406**: O stub é embutido no fuste; comprimento de embutimento e inclinação são tomados do catálogo.

## 7. Validações

| ID | Regra | Severidade | Condição |
|----|-------|-----------|----------|
| V-401 | D_b ≥ D_f | Bloqueante | `D_b < D_f` |
| V-402 | H_f, H_tc, H_b > 0 | Bloqueante | valor ≤ 0 |
| V-403 | H_tc compatível com transição (D_b-D_f) | Alerta | tangente excessiva (faixa: **unknown** — TODO) |
| V-404 | Afl ≥ mínimo | Alerta | `Afl < Afl_min` (**unknown**) |
| V-405 | Stub do catálogo compatível com D_f | Bloqueante | catálogo |
| V-406 | VT consistente com soma das parcelas | Bloqueante (auto-check) | divergência |

## 8. Cálculos (Fórmulas)

### 8.1 Fuste (cilindro)
```
Vf = π * (D_f^2 / 4) * H_f
```

### 8.2 Tronco de Cone
```
Vtc = (π * H_tc / 12) * ( D_b^2 + D_b*D_f + D_f^2 )
```

### 8.3 Base (cilindro)
```
Vb = π * (D_b^2 / 4) * H_b
```

### 8.4 Volume Total e Escavação
```
VT = Vf + Vtc + Vb
VE = VT * (1 + folga)   // folga: % do projeto. unknown — TODO
```

### 8.5 Afloramento, Profundidade, NFC
```
Afl = Nc - Ncc
H   = H_f + H_tc + H_b
NFC = Ncc - H              // nível de fundo de concretagem
G   = Afl + dist           // dist = distância do ponto de referência
```

## 9. Fluxos
1. Usuário seleciona Tubulão para a perna/elemento.
2. UI carrega o banco de fundações tipo Tubulão.
3. Usuário escolhe a dimensão (D_f, D_b, H_f, H_tc, H_b) do catálogo.
4. Sistema preenche os campos automaticamente; usuário pode sobrescrever (com aviso).
5. Sistema calcula Vf, Vtc, Vb, VT, VE, Afl, H, NFC, G.
6. Validações são exibidas.

## 10. UI/UX — Requisitos
- Seletor do banco de fundações (dropdown) com pré-visualização das dimensões.
- Campos editáveis com aviso se diferem do catálogo.
- Bloco de "Resultados Calculados" somente leitura.
- Diagrama esquemático opcional (corte vertical mostrando fuste, tronco de cone, base).

## 11. Módulos/Serviços (Hexagonal + NestJS)
- **Domain Service**: `CaissonVolumeCalculator` (`domain/services/`).
- **Domain Service**: `CaissonDepthCalculator`.
- **Port**: `FoundationCatalogRepository.findCaissonOptions()`.
- **Adapter**: `PostgresFoundationCatalogRepositoryAdapter`.
- **Tests (TDD)**:
  - `caisson-volume-calculator.spec.ts` (unit).
  - `caisson-depth-calculator.spec.ts` (unit).
  - `postgres-foundation-catalog-repository.int-spec.ts` (integration).

## 12. Critérios de Aceitação
- **CA-401**: Selecionando uma dimensão do banco, o sistema preenche os campos.
- **CA-402**: VT = Vf+Vtc+Vb com precisão de 4 casas decimais.
- **CA-403**: Afl e H calculados a partir de Nc, Ncc e geometria.
- **CA-404**: É possível usar Tubulão em qualquer perna (autoportante) ou qualquer elemento (estaiada).

## 13. TODO / Pendências
- Tabela do banco de fundações Tubulão (dimensões padrão por carga): **unknown** — TODO extrair dos PDFs anexos.
- % de folga para escavação: **unknown** — TODO.
- Tabela de armação por dimensão: **unknown** — TODO.
- Compatibilidades de stub: **unknown** — TODO.
