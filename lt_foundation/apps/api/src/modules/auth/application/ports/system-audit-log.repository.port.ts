export interface CreateAuditLogInput {
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

export interface SystemAuditLogRepositoryPort {
  create(input: CreateAuditLogInput): Promise<void>;
}

export const SYSTEM_AUDIT_LOG_REPOSITORY = Symbol('SYSTEM_AUDIT_LOG_REPOSITORY');
