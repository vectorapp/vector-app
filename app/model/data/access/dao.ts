import type { User } from '../../types';

// Generic DAO interface for CRUD operations
export interface Dao<T> {
  create(item: Omit<T, 'id' | 'createdAt'>): Promise<T>;
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  update(id: string, item: Partial<Omit<T, 'id' | 'createdAt'>>): Promise<T>;
  delete(id: string): Promise<void>;
}

// Specific DAO interface for User
export interface UserDao extends Dao<User> {
  findByEmail(email: string): Promise<User | null>;
} 