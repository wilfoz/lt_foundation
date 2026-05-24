# 45 — Autenticação, Perfis e Rastreabilidade

## 1. Objetivo
Definir o mecanismo de **autenticação** de usuários, os **perfis de acesso** (roles), a estratégia de **sessão/JWT** e a **rastreabilidade** de todas as ações críticas no sistema.

## 2. Escopo
**In scope**: login/logout, geração e validação de JWT, perfis de acesso, guard de rotas (NestJS + Angular), rastreabilidade vinculada à auditoria.

**Out of scope**: gestão avançada de identidade (SSO, LDAP, OAuth com providers externos): **unknown** — TODO confirmar. Permissões granulares por obra: **unknown** — TODO.

## 3. Glossário

| Termo | Definição |
|-------|-----------|
| Usuário | Pessoa autenticada que opera o sistema. |
| Role | Papel do usuário: `ADMIN`, `ENGINEER`, `REVIEWER`, `VIEWER`. |
| JWT | JSON Web Token — token stateless de autenticação. |
| Guard | Proteção de rota NestJS (backend) ou Angular Route Guard (frontend). |
| AuditLog | Registro de ação sensível: quem, o quê, quando. |
| Claim | Dado embutido no payload do JWT (userId, role, email). |

## 4. Entidades do Domínio

```ts
class User {
  id: UserId;
  email: string;
  name: string;
  role: UserRole;
  passwordHash: string;              // bcrypt
  active: boolean;
  createdAt: Date;
  lastLoginAt?: Date;
}

enum UserRole { ADMIN, ENGINEER, REVIEWER, VIEWER }

class Session {                      // Refresh token tracking (opcional)
  id: SessionId;
  userId: UserId;
  refreshTokenHash: string;
  expiresAt: Date;
  createdAt: Date;
  revokedAt?: Date;
}

class SystemAuditLog {              // Log global de ações críticas
  id: AuditLogId;
  userId: UserId;
  action: string;                   // ex.: "APPROVE_REVIEW_ITEM", "EMIT_SPREADSHEET"
  entityType: string;               // ex.: "ReviewItem", "Work", "Tower"
  entityId: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
  ipAddress?: string;
}
```

## 5. Entradas / Saídas

| Input | Obrigatório | Descrição |
|-------|-------------|-----------|
| `email` | Sim | E-mail do usuário |
| `password` | Sim | Senha em texto plano (transmitida via HTTPS) |

| Output | Descrição |
|--------|-----------|
| `accessToken` | JWT com validade de 1h (configurável) |
| `refreshToken` | Token de refresh com validade de 7d (configurável) |
| `user.id`, `user.role` | Claims do usuário autenticado |

## 6. Perfis de Acesso (RBAC)

| Role | Permissões |
|------|-----------|
| `ADMIN` | Todas as ações + gestão de usuários |
| `ENGINEER` | CRUD de obras, torres, fundações; upload de documentos; emissão de planilhas |
| `REVIEWER` | Somente validação humana (spec 35); leitura de obras/torres |
| `VIEWER` | Somente leitura em todas as entidades |

### Matriz de acesso (simplificada)

| Recurso | ADMIN | ENGINEER | REVIEWER | VIEWER |
|---------|-------|----------|----------|--------|
| Criar/editar obra | ✅ | ✅ | ❌ | ❌ |
| Upload de documentos | ✅ | ✅ | ❌ | ❌ |
| Revisar/aprovar dados | ✅ | ✅ | ✅ | ❌ |
| Calcular fundações | ✅ | ✅ | ❌ | ❌ |
| Emitir planilha | ✅ | ✅ | ❌ | ❌ |
| Ver obras/dados | ✅ | ✅ | ✅ | ✅ |
| Gerenciar usuários | ✅ | ❌ | ❌ | ❌ |

## 7. Regras de Negócio

- **RN-401**: Toda requisição autenticada deve portar JWT válido no header `Authorization: Bearer <token>`.
- **RN-402**: JWT expirado retorna HTTP 401; o cliente deve usar `refreshToken` para obter novo `accessToken`.
- **RN-403**: Senha deve ter mínimo 8 caracteres com ao menos 1 número e 1 letra maiúscula.
- **RN-404**: `passwordHash` nunca é exposto em nenhum endpoint.
- **RN-405**: Usuário inativo (`active = false`) não pode autenticar.
- **RN-406**: Toda ação crítica (aprovar revisão, emitir planilha, arquivar obra) gera `SystemAuditLog`.
- **RN-407**: O `userId` do JWT é validado contra o banco a cada requisição crítica (evitar uso de tokens de usuários desativados).
- **RN-408**: Logout revoga o `refreshToken` ativo.

## 8. Validações

| ID | Condição | Severidade |
|----|----------|-----------|
| V-401 | E-mail não cadastrado | Bloqueante (HTTP 401) |
| V-402 | Senha incorreta | Bloqueante (HTTP 401) |
| V-403 | JWT expirado | Bloqueante (HTTP 401) |
| V-404 | JWT inválido/malformado | Bloqueante (HTTP 401) |
| V-405 | Usuário inativo | Bloqueante (HTTP 403) |
| V-406 | Role insuficiente para a ação | Bloqueante (HTTP 403) |
| V-407 | Senha abaixo do critério de complexidade | Bloqueante |

## 9. Fluxos

### 9.1 Login
```
1. POST /auth/login { email, password }
2. Validar email e senha (V-401, V-402, V-403)
3. Verificar user.active (V-405)
4. Gerar accessToken (JWT, 1h) + refreshToken (7d)
5. Registrar lastLoginAt
6. Retornar { accessToken, refreshToken, user: { id, name, role } }
```

### 9.2 Refresh Token
```
1. POST /auth/refresh { refreshToken }
2. Validar refreshToken (não expirado, não revogado)
3. Gerar novo accessToken
4. Retornar { accessToken }
```

### 9.3 Logout
```
1. POST /auth/logout (com accessToken)
2. Revogar refreshToken ativo do usuário
3. Retornar HTTP 204
```

### 9.4 Guard de Rota (NestJS)
```
Toda rota protegida:
  → JwtAuthGuard: valida token
  → RolesGuard: verifica role do usuário vs roles permitidas (@Roles(...))
  → Se falhar: HTTP 401 ou 403
```

## 10. Requisitos de UI/UX

### Página: `/auth/login`
- Formulário: e-mail, senha, botão "Entrar".
- Mensagem de erro genérica em caso de credenciais inválidas (não revelar se e-mail existe).
- Link "Esqueci minha senha": **unknown** — TODO.
- Redirecionamento pós-login para `/dashboard`.

### Guard Angular (frontend)
- `AuthGuard` — redireciona para `/auth/login` se não autenticado.
- `RoleGuard` — redireciona para `/dashboard` se role insuficiente.
- Token armazenado em memória (não `localStorage`) para segurança XSS. **unknown** — TODO confirmar estratégia.

### Angular v20+
- `LoginComponent` — standalone.
- `AuthService` — Signal para estado de autenticação (`isLoggedIn`, `currentUser`).
- Interceptor HTTP para injetar `Authorization` header.
- Interceptor para refresh automático em erro 401.

## 11. Módulos / Serviços

### Outbound Ports
- `UserRepository` — busca usuário por email, atualiza `lastLoginAt`.
- `SessionRepository` — CRUD de refresh tokens.
- `SystemAuditLogRepository` — inserção append-only.

### Inbound / Use Cases
- `LoginUseCase` — valida credenciais, gera tokens.
- `RefreshTokenUseCase` — valida refresh token, gera novo access token.
- `LogoutUseCase` — revoga refresh token.
- `LogAuditActionUseCase` — registra ação crítica no SystemAuditLog.

### Adapters
- `PostgresUserRepositoryAdapter`.
- `PostgresSessionRepositoryAdapter`.
- `BcryptPasswordHasherAdapter`.
- `JwtTokenServiceAdapter` (NestJS `@nestjs/jwt`).
- `AuthController` — NestJS REST controller.
- `JwtAuthGuard`, `RolesGuard` — NestJS guards.

## 12. Critérios de Aceitação

- **CA-450**: Login com credenciais válidas retorna `accessToken` e `refreshToken`.
- **CA-451**: Login com senha errada retorna HTTP 401 com mensagem genérica.
- **CA-452**: Usuário inativo recebe HTTP 403.
- **CA-453**: Requisição sem JWT retorna HTTP 401.
- **CA-454**: Requisição com role insuficiente retorna HTTP 403.
- **CA-455**: Refresh token expirado retorna HTTP 401.
- **CA-456**: Toda aprovação de `ReviewItem` gera `SystemAuditLog` com `userId`, `entityId` e `timestamp`.
- **CA-457**: Toda emissão de planilha gera `SystemAuditLog`.
- **CA-458**: Logout revoga o refresh token; uso posterior retorna HTTP 401.

## 13. TODO / Pendências
- SSO / LDAP / OAuth (Google, Microsoft): **unknown** — TODO confirmar se necessário.
- Política de recuperação de senha: **unknown** — TODO.
- Estratégia de armazenamento do token no frontend (memória vs cookie httpOnly): **unknown** — TODO.
- Permissões por obra (usuário X pode acessar apenas obras Y e Z): **unknown** — TODO.
- 2FA (autenticação de dois fatores): **unknown** — TODO.
