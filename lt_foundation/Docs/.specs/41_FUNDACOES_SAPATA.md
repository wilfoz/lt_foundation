# 41 — Fundação Tipo Sapata (`FootingFoundation`)

> Código: `kind = 'FOOTING'`. Classe: `FootingFoundation`. Calculators: `FootingVolumeCalculator`, `FootingLocationCalculator`. Ver `05_ARCHITECTURE_AND_STACK.md`.

## 1. Objetivo
Especificar a fundação tipo **Sapata**, aplicável tanto a torres autoportantes (por perna) quanto estaiadas (por elemento). A sapata tem geometria prismática e exige locação por cantos (S1..S4).

## 2. Escopo
**In scope**: geometria (L, B, H), inputs, locação por cantos S1..S4, volumes, profundidade, afloramento, validações específicas, stub.

**Out of scope**: dimensionamento estrutural fino (armadura detalhada).

## 3. Glossário
- **L**: comprimento da sapata.
- **B**: largura da sapata.
- **H_s**: altura da sapata.
- **S1..S4**: cantos da sapata (locação topográfica).
- **V**: volume de concreto.
- **VE**: volume de escavação.

## 4. Entidades de Domínio (TypeScript)

```ts
class FootingFoundation extends Foundation {
  readonly kind = 'FOOTING' as const;
  geometry: {
    length: number;            // L
    width: number;             // B
    height: number;            // H_s
    pedestal?: { length: number; width: number; height: number };
  };
  reinforcement?: Reinforcement;        // unknown — TODO
  corners: { s1: Point2D; s2: Point2D; s3: Point2D; s4: Point2D };
  depth: { totalDepth: number; concreteBottomLevel: number; protrusion: number }; // H, NFC, Afl
  volumes: { totalVolume: number; excavationVolume: number };                     // V, VE
}
```

## 5. Inputs vs Outputs

| Input (obrigatório) | Tipo | Output |
|---------------------|------|--------|
| L | número (m) | V, locação dos cantos |
| B | número (m) | V, locação dos cantos |
| H_s | número (m) | V |
| Pedestal (h_p, b_p, l_p) | objeto (opcional) | V_pedestal |
| Nc | número (m) | Afl |
| Ncc | número (m) | Afl, NFC |
| Orientação do bloco (azimute) | número (graus) | Posição S1..S4 |
| Stub (tipo, embutimento) | objeto | Posição do stub no pedestal/sapata |

## 6. Regras de Negócio

- **RN-411**: A sapata é prismática (planta retangular); usar cantos S1..S4 para locação.
- **RN-412**: Volume da sapata: `V_sapata = L * B * H_s`.
- **RN-413**: Se houver pedestal: `V_pedestal = l_p * b_p * h_p`. `V_total = V_sapata + V_pedestal`.
- **RN-414**: Locação dos cantos depende da orientação (azimute) e do centro de locação.
- **RN-415**: Afloramento `Afl = Nc - Ncc`; específico ao ponto do bloco.
- **RN-416**: `VE = V_total * (1 + folga)`.

## 7. Validações

| ID | Regra | Severidade | Condição |
|----|-------|-----------|----------|
| V-411 | L, B, H_s > 0 | Bloqueante | valor ≤ 0 |
| V-412 | Pedestal cabe dentro da sapata (l_p ≤ L, b_p ≤ B) | Bloqueante | dimensão excede |
| V-413 | Azimute em [0°, 360°) | Bloqueante | fora |
| V-414 | Afl ≥ mínimo | Alerta | `Afl < Afl_min` (**unknown**) |
| V-415 | Stub compatível com pedestal/sapata | Bloqueante | catálogo |
| V-416 | Cantos S1..S4 não colidem com outros elementos | Alerta | sobreposição em planta |

## 8. Cálculos (Fórmulas)

### 8.1 Volume
```
V_sapata   = L * B * H_s
V_pedestal = (l_p * b_p * h_p) || 0
V          = V_sapata + V_pedestal
VE         = V * (1 + folga)
```

### 8.2 Cantos S1..S4 (planta, sistema local)
Considerando centro `(x0, y0)`, azimute `θ`, L (eixo x' local) e B (eixo y' local):
```
dx = L/2,  dy = B/2
S1 = ( x0 + dx*cos(θ) - dy*sin(θ),  y0 + dx*sin(θ) + dy*cos(θ) )
S2 = ( x0 - dx*cos(θ) - dy*sin(θ),  y0 - dx*sin(θ) + dy*cos(θ) )
S3 = ( x0 - dx*cos(θ) + dy*sin(θ),  y0 - dx*sin(θ) - dy*cos(θ) )
S4 = ( x0 + dx*cos(θ) + dy*sin(θ),  y0 + dx*sin(θ) - dy*cos(θ) )
```

### 8.3 Afloramento, Profundidade, NFC
```
Afl = Nc - Ncc
H   = H_s + (h_p, se pedestal)
NFC = Ncc - H
G   = Afl + dist
```

## 9. Fluxos
1. Usuário seleciona Sapata para perna/elemento.
2. UI carrega banco de fundações tipo Sapata.
3. Usuário escolhe dimensão (L, B, H_s, pedestal opcional).
4. Sistema calcula V, VE, Afl, H, NFC, S1..S4.
5. Validações exibidas.

## 10. UI/UX — Requisitos
- Seletor do banco de fundações Sapata.
- Campos editáveis (com aviso se diferentes do catálogo).
- Visualização em planta com S1..S4 e orientação (azimute).
- Bloco de resultados somente leitura.

## 11. Módulos/Serviços (Hexagonal + NestJS)
- **Domain Service**: `FootingVolumeCalculator`.
- **Domain Service**: `FootingLocationCalculator` (cantos S1..S4).
- **Domain Service**: `FootingDepthCalculator`.
- **Port**: `FoundationCatalogRepository.findFootingOptions()`.
- **Tests (TDD)**:
  - `footing-volume-calculator.spec.ts` (unit).
  - `footing-location-calculator.spec.ts` (unit) — incluir casos para `azimuth ∈ {0°, 45°, 90°, 180°, 270°}`.
  - `footing-depth-calculator.spec.ts` (unit).

## 12. Critérios de Aceitação
- **CA-411**: Selecionar uma sapata do banco preenche L, B, H_s e pedestal (se houver).
- **CA-412**: V calculado conforme RN-412 e RN-413.
- **CA-413**: Cantos S1..S4 calculados em função de centro, orientação e dimensões.
- **CA-414**: Sapata utilizável em qualquer perna (autoportante) ou elemento (estaiada).

## 13. TODO / Pendências
- Tabela do banco de fundações Sapata: **unknown** — TODO.
- Política de pedestal padrão por tipo de torre: **unknown** — TODO.
- % folga de escavação: **unknown** — TODO.
- Regras de orientação automática (azimute) versus manual: **unknown** — TODO.
