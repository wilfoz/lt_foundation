# 35 — Validação Humana de Dados Extraídos

## 1. Objetivo
Garantir que **nenhum dado extraído automaticamente** (pelo pipeline de ingestão, spec 25) persista no domínio sem revisão e aprovação humana explícita. Definir a fila de revisão, o fluxo de edição de campos, aprovação/rejeição e a trilha de auditoria completa.

## 2. Escopo
**In scope**: fila de itens pendentes de revisão, interface de revisão por campo, edição e justificativa, aprovação/rejeição de registros, auditoria de toda alteração.

**Out of scope**: extração automática de dados (spec 25), cálculo de fundações (spec 60), autenticação (spec 45).

## 3. Glossário

| Termo | Definição |
|-------|-----------|
| ReviewItem | Unidade de revisão humana: um `ParsedRecord` aguardando aprovação. |
| ReviewField | Campo individual dentro de um `ReviewItem`, editável pelo revisor. |
| AuditEntry | Registro imutável de cada alteração feita por um usuário. |
| ReviewDecision | `APPROVED` ou `REJECTED` — decisão final sobre um `ReviewItem`. |
| Override | Substituição manual do valor extraído pela IA por um valor humano. |
| ConfidenceBadge | Indicação visual de confiança: Verde (≥0.9), Amarelo (0.6–0.89), Vermelho (<0.6). |

## 4. Entidades do Domínio

```ts
class ReviewItem {                     // Raiz de agregado da validação
  id: ReviewItemId;
  workId: WorkId;
  jobId: IngestionJobId;
  parsedRecordId: string;
  entityType: 'TOWER' | 'LEG' | 'STAY' | 'FOUNDATION' | 'LOCATION';
  status: ReviewStatus;
  fields: ReviewField[];
  decision?: ReviewDecision;
  reviewedBy?: UserId;
  reviewedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
}

enum ReviewStatus { PENDING, IN_REVIEW, APPROVED, REJECTED }

class ReviewField {
  id: ReviewFieldId;
  reviewItemId: ReviewItemId;
  key: string;                          // ex.: "deflectionAngle", "ncLegA"
  extractedValue: string;               // valor bruto da IA
  parsedValue?: unknown;                // valor após parser automático
  humanValue?: unknown;                 // valor corrigido pelo revisor (se editado)
  finalValue: unknown;                  // humanValue ?? parsedValue
  confidence: number;                   // [0,1] da IA
  needsReview: boolean;                 // confidence < THRESHOLD_LOW
  overridden: boolean;                  // true se humanValue != null
  auditEntries: AuditEntry[];
}

class AuditEntry {
  id: AuditEntryId;
  reviewFieldId: ReviewFieldId;
  userId: UserId;
  action: 'OVERRIDE' | 'REVERT' | 'APPROVE' | 'REJECT';
  previousValue?: unknown;
  newValue?: unknown;
  justification?: string;
  timestamp: Date;
}
```

## 5. Entradas / Saídas

| Input | Obrigatório | Descrição |
|-------|-------------|-----------|
| `reviewItemId` | Sim | Item sendo revisado |
| `fieldKey` | Sim | Campo sendo editado |
| `humanValue` | Sim (override) | Valor corrigido pelo revisor |
| `justification` | Não (recomendado) | Razão da correção |
| `decision` | Sim (finalizar) | `APPROVED` ou `REJECTED` |
| `rejectionReason` | Sim se REJECTED | Motivo da rejeição |

| Output | Descrição |
|--------|-----------|
| `reviewItem.status` | Status atualizado |
| `reviewItem.fields[].finalValue` | Valor final (humano ou IA) |
| Domínio persistido | Entidade criada/atualizada após APPROVED |
| `auditEntry` | Registro imutável da ação |

## 6. Regras de Negócio

- **RN-301**: Um `ReviewItem` só pode ser aprovado quando todos os `ReviewField` com `needsReview = true` foram inspecionados.
- **RN-302**: Aprovar um `ReviewItem` persiste o `ParsedRecord` como entidade de domínio (Torre, Perna, Fundação, Locação).
- **RN-303**: Rejeitar um `ReviewItem` descarta o dado extraído e mantém o job em estado revisável.
- **RN-304**: Toda edição de um `ReviewField` cria um `AuditEntry` imutável.
- **RN-305**: O `finalValue` de um campo é sempre `humanValue` se presente, senão `parsedValue`.
- **RN-306**: Um item `APPROVED` é somente-leitura — nenhuma edição permitida.
- **RN-307**: Dados teóricos (projeto) e dados de campo são modelos separados; o revisor deve indicar a origem ao aprovar.
- **RN-308**: O revisor não pode aprovar o próprio item que ele mesmo gerou por upload (separação de funções). **unknown** — TODO confirmar se regra se aplica.
- **RN-309**: A auditoria registra o estado anterior e posterior de cada campo editado.
- **RN-310**: Múltiplos `ReviewItem` de um mesmo job podem ser aprovados independentemente.

## 7. Validações

| ID | Condição | Severidade |
|----|----------|-----------|
| V-301 | Tentar aprovar item com campos `needsReview` não inspecionados | Bloqueante |
| V-302 | Tentar editar item com status `APPROVED` | Bloqueante |
| V-303 | Rejeição sem `rejectionReason` | Bloqueante |
| V-304 | `humanValue` de campo numérico fora do range esperado | Alerta |
| V-305 | Override sem justificativa em campo de alta confiança (≥0.9) | Alerta |
| V-306 | Item em `PENDING` há mais de 7 dias sem interação | Informativa |

## 8. Fluxos

### 8.1 Fluxo de Revisão
```
1. Revisor acessa /obras/:id/validacao
   - Vê lista de ReviewItems com status PENDING

2. Abre item específico
   - Visualiza campos extraídos com badges de confiança
   - Campos vermelhos (needsReview=true) destacados

3. Para cada campo vermelho/amarelo:
   - Revisor verifica valor extraído vs documento original (preview lateral)
   - Se correto: marca como inspecionado
   - Se incorreto: edita humanValue + justificativa opcional

4. Decisão final:
   - APPROVE: sistema valida RN-301, persiste entidades, cria AuditEntry
   - REJECT: sistema solicita rejectionReason, descarta ParsedRecord

5. Confirmação e retorno à fila
```

### 8.2 Fluxo de Auditoria
```
Toda ação (override, revert, approve, reject) →
  criar AuditEntry com:
    - userId
    - timestamp
    - previousValue
    - newValue
    - justification
  → imutável (sem UPDATE/DELETE na tabela de audit)
```

## 9. Requisitos de UI/UX

### Página: `/obras/:id/validacao`
- Lista de `ReviewItem` pendentes com: tipo de entidade, job de origem, qtd de campos com `needsReview`, data de entrada na fila.
- Filtros: por tipo de entidade, por `needsReview > 0`.
- Contador de itens pendentes no badge da navbar.

### Componente: ReviewItemDetailPanel
- Layout dividido em dois painéis:
  - **Esquerdo**: formulário de campos com ConfidenceBadge por campo.
  - **Direito**: preview do documento original (PDF viewer) ou preview da linha Excel.
- Campos editáveis com input destacado (borda amarela = precisa revisão, vermelha = bloqueante).
- Indicador visual de `overridden` (ícone de lápis) vs valor da IA.
- Botão "Aprovar" habilitado apenas quando RN-301 satisfeito.
- Botão "Rejeitar" abre modal com campo de motivo obrigatório.

### Componente: AuditTrailPanel
- Histórico de ações do item atual em ordem cronológica.
- Exibe: usuário, ação, campo, valor anterior → novo, justificativa.

### Angular v20+
- `ValidationQueueComponent`, `ReviewItemDetailComponent`, `AuditTrailComponent` — standalone.
- Signals para estado do formulário de revisão.
- Computed signal para `canApprove` (todos os needsReview inspecionados).
- `@defer` para carregamento do PDF viewer.

## 10. Módulos / Serviços

### Outbound Ports
- `ReviewItemRepository` — CRUD de itens e campos de revisão.
- `AuditLogRepository` — inserção append-only de audit entries.
- `DomainPersistencePort` — persiste entidade aprovada no bounded context correspondente.

### Inbound / Use Cases
- `GetReviewQueueUseCase` — lista itens pendentes por obra.
- `InspectReviewFieldUseCase` — marca campo como inspecionado.
- `OverrideReviewFieldUseCase` — edita valor de um campo + cria AuditEntry.
- `ApproveReviewItemUseCase` — valida RN-301, persiste entidade, fecha item.
- `RejectReviewItemUseCase` — rejeita item com motivo, cria AuditEntry.

### Adapters
- `PostgresReviewItemRepositoryAdapter`.
- `PostgresAuditLogRepositoryAdapter` — append-only.
- `ValidationController` — NestJS REST controller.
- Dispatcher interno que chama `DomainPersistencePort` para o bounded context correto após aprovação.

## 11. Critérios de Aceitação

- **CA-350**: Nenhuma entidade de domínio é criada sem aprovação de um `ReviewItem`.
- **CA-351**: Campos com `confidence < 0.6` chegam à tela com badge vermelho e `needsReview = true`.
- **CA-352**: Tentar aprovar item com campos `needsReview` não inspecionados retorna erro V-301.
- **CA-353**: Aprovação de `ReviewItem` persiste entidade de domínio correspondente.
- **CA-354**: Toda edição de campo cria `AuditEntry` com `previousValue`, `newValue` e `userId`.
- **CA-355**: Rejeição sem `rejectionReason` retorna erro V-303.
- **CA-356**: Item aprovado retorna erro V-302 em qualquer tentativa de edição.
- **CA-357**: AuditTrail exibe histórico completo em ordem cronológica por item.
- **CA-358**: `finalValue` sempre usa `humanValue` quando presente, senão `parsedValue`.

## 12. TODO / Pendências
- Regra RN-308 (separação de funções upload vs revisão): **unknown** — TODO confirmar requisito.
- SLA de revisão (notificação após N dias sem revisão): **unknown** — TODO.
- Exibição de confiança por campo nos dados teórico vs campo: **unknown** — TODO.
- Integração do PDF viewer (pdfjs-dist vs Google Drive embed): **unknown** — TODO.
- Política de re-revisão após rejeição: se o mesmo revisor pode reenviar: **unknown** — TODO.
