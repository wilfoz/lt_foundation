# 15 — Gestão de Obra

## 1. Objetivo
Definir **Obra** como o agregado raiz do sistema — toda torre, documento, fundação e locação pertence a uma obra. Centralizar o contexto de trabalho do usuário e garantir rastreabilidade completa dos dados dentro do escopo de uma obra.

## 2. Escopo
**In scope**: criação e gestão de obras; associação de torres, documentos e fundações a uma obra; resumo de status e progresso; archivamento.

**Out of scope**: cálculos de fundações (spec 60), emissão de planilhas (spec 70), pipeline de ingestão de documentos (spec 25).

## 3. Glossário

| Termo | Definição |
|-------|-----------|
| Obra | Conjunto de torres de uma LT definidas por contrato. Raiz do sistema. |
| Contrato | Identificador e número do contrato associado à obra. |
| LT | Linha de Transmissão. |
| Torre da Obra | Instância de torre vinculada a uma obra específica. |
| Locação | Posição topográfica de uma torre ou elemento dentro da obra. |
| Status da Obra | Enum: `DRAFT`, `IN_PROGRESS`, `COMPLETED`, `ARCHIVED`. |

## 4. Entidades do Domínio

```ts
class Work {                           // Obra — raiz de agregado
  id: WorkId;
  name: string;                        // Ex.: "LT 500kV — Trecho Norte"
  contractNumber: string;
  description?: string;
  status: WorkStatus;                  // DRAFT | IN_PROGRESS | COMPLETED | ARCHIVED
  createdBy: UserId;
  createdAt: Date;
  updatedAt: Date;
}

enum WorkStatus { DRAFT, IN_PROGRESS, COMPLETED, ARCHIVED }

class WorkTower {                      // Torre vinculada à obra
  id: WorkTowerId;
  workId: WorkId;
  towerId: TowerId;
  sequence: number;                    // Posição na LT (ex.: torre 42)
  alias?: string;                      // Apelido/código de campo
  status: TowerStatus;                 // PENDING | IN_PROGRESS | CALCULATED | EMITTED
}

class WorkDocument {                   // Documento vinculado à obra
  id: WorkDocumentId;
  workId: WorkId;
  ingestionJobId?: IngestionJobId;     // vínculo com pipeline (spec 25)
  fileName: string;
  fileType: DocumentFileType;          // PDF | EXCEL
  uploadedBy: UserId;
  uploadedAt: Date;
  pipelineStatus: PipelineStatus;     // UPLOADED | PROCESSING | PENDING_REVIEW | REVIEWED | FAILED
}
```

## 5. Entradas / Saídas

| Input | Obrigatório | Tipo |
|-------|-------------|------|
| Nome da obra | Sim | string |
| Número do contrato | Sim | string |
| Descrição | Não | string |

| Output | Descrição |
|--------|-----------|
| `work.id` | UUID da obra criada |
| `work.status` | Status corrente |
| Lista de torres | Com status calculado/emitido por torre |
| Contagem de documentos | Por status do pipeline |
| Contagem de validações pendentes | Fila de revisão humana |

## 6. Regras de Negócio

- **RN-101**: Toda torre pertence a exatamente uma obra.
- **RN-102**: Todo documento pertence a exatamente uma obra.
- **RN-103**: Uma obra pode conter múltiplas torres e múltiplos documentos.
- **RN-104**: Não é possível deletar uma obra com torres ou documentos vinculados; usar `ARCHIVED`.
- **RN-105**: O `sequence` da torre dentro da obra deve ser único por obra.
- **RN-106**: O status da obra é derivado: `COMPLETED` apenas quando todos os cálculos estão emitidos.
- **RN-107**: Somente usuários autenticados podem criar, editar ou arquivar obras (ver spec 45).
- **RN-108**: A obra arquivada (`ARCHIVED`) é somente-leitura — nenhuma edição permitida.

## 7. Validações

| ID | Condição | Severidade |
|----|----------|-----------|
| V-150 | Nome da obra em branco | Bloqueante |
| V-151 | Número do contrato em branco | Bloqueante |
| V-152 | `sequence` duplicado na mesma obra | Bloqueante |
| V-153 | Tentativa de editar obra `ARCHIVED` | Bloqueante |
| V-154 | Obra sem torres após 30 dias em `DRAFT` | Informativa |

## 8. Fluxos

### 8.1 Criar Obra
1. Usuário acessa `/obras` → clica em "Nova Obra".
2. Preenche nome, contrato e descrição opcional.
3. Sistema cria obra com status `DRAFT`.
4. Redireciona para `/obras/:id`.

### 8.2 Adicionar Torres à Obra
1. Usuário acessa `/obras/:id/torres` → clica em "Adicionar Torre".
2. Seleciona tipo de torre do catálogo.
3. Informa sequência e alias.
4. Sistema vincula torre à obra (status `PENDING`).

### 8.3 Ingerir Documentos
1. Usuário acessa `/obras/:id/documentos` → faz upload de PDF ou Excel.
2. Sistema cria `WorkDocument` e inicia pipeline (spec 25).
3. Status atualizado conforme avanço do pipeline.

### 8.4 Arquivar Obra
1. Usuário aciona "Arquivar" na tela de detalhe.
2. Sistema verifica ausência de cálculos pendentes.
3. Status muda para `ARCHIVED`; obra fica somente-leitura.

## 9. Requisitos de UI/UX

### Página: `/obras`
- Lista de obras com colunas: Nome, Contrato, Torres (qtd), Status, Data de criação.
- Filtros: por status, por data.
- Botão "Nova Obra" abre formulário lateral (side panel).

### Página: `/obras/:id` (Detalhe da Obra)
- Header: nome, contrato, status com badge colorido.
- Cards de resumo:
  - Torres: total / calculadas / emitidas.
  - Documentos: total / em processamento / pendentes de revisão.
  - Validações pendentes (link para fila).
- Abas: Torres | Documentos | Validação | Histórico.

### Página: `/obras/:id/torres`
- Tabela: sequência, alias, tipo de torre, status, ações (calcular, emitir).
- Botão "Adicionar Torre".

### Angular v20+
- `WorkListComponent`, `WorkDetailComponent`, `WorkTowerListComponent` — standalone.
- Signals para estado local (status, contadores).
- Loading skeleton para listas.

## 10. Módulos / Serviços

### Outbound Ports
- `WorkRepository`: CRUD de obras e torres da obra.
- `WorkDocumentRepository`: CRUD de documentos da obra.

### Inbound / Use Cases
- `CreateWorkUseCase` — cria obra com validações.
- `AddTowerToWorkUseCase` — vincula torre à obra.
- `UpdateWorkStatusUseCase` — atualiza status (com regras RN-106/108).
- `ArchiveWorkUseCase` — arquiva obra.
- `GetWorkSummaryUseCase` — retorna contadores de resumo.

### Adapters
- `PostgresWorkRepositoryAdapter` — implementa `WorkRepository`.
- `WorkController` — NestJS REST controller.

## 11. Critérios de Aceitação

- **CA-150**: Criar obra com nome e contrato retorna `work.id` e status `DRAFT`.
- **CA-151**: Adicionar torre à obra com sequence duplicado retorna erro V-152.
- **CA-152**: Obra arquivada rejeita qualquer PUT/PATCH com erro V-153.
- **CA-153**: `/obras/:id` exibe contadores corretos de torres, documentos e validações pendentes.
- **CA-154**: Obra com todas as torres emitidas transita automaticamente para `COMPLETED`.
- **CA-155**: Lista de obras paginada suporta filtro por status e data.

## 12. TODO / Pendências
- Política de compartilhamento de obra entre usuários: **unknown** — TODO.
- Exportação de resumo da obra (PDF/Excel): **unknown** — TODO.
- Notificações (e-mail/push) para eventos da obra: **unknown** — TODO.
- Histórico de auditoria visível na aba "Histórico": integração com spec 45.
