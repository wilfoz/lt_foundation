export enum UserRole {
  ADMIN = 'ADMIN',
  ENGINEER = 'ENGINEER',
  REVIEWER = 'REVIEWER',
  VIEWER = 'VIEWER',
}

export class UserEntity {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly name: string,
    public readonly role: UserRole,
    public readonly passwordHash: string,
    public readonly active: boolean,
    public readonly createdAt: Date,
    public readonly lastLoginAt?: Date,
  ) {}

  isActive(): boolean {
    return this.active;
  }

  hasRole(...roles: UserRole[]): boolean {
    return roles.includes(this.role);
  }
}
