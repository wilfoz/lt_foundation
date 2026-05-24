import { UserEntity } from '../../domain/entities/user.entity';

export interface UserRepositoryPort {
  findByEmail(email: string): Promise<UserEntity | null>;
  findById(id: string): Promise<UserEntity | null>;
  updateLastLogin(id: string, at: Date): Promise<void>;
}

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
