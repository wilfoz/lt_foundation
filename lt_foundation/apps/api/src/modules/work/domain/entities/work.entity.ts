export enum WorkStatus {
  DRAFT = 'DRAFT',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED',
}

export class WorkEntity {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly contractNumber: string,
    public readonly status: WorkStatus,
    public readonly createdById: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly description?: string,
  ) {}

  isArchived(): boolean {
    return this.status === WorkStatus.ARCHIVED;
  }
}
