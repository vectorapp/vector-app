import { FirestoreUserDao } from './firestore-dao';
import type { User } from '../../types';

// Singleton instance of the User DAO
let userDao: FirestoreUserDao | null = null;

function getUserDao(): FirestoreUserDao {
  if (!userDao) {
    userDao = new FirestoreUserDao();
  }
  return userDao;
}

// DataService class that provides business logic operations
export class DataService {
  // User operations
  static async createUser(user: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    return getUserDao().create(user);
  }

  static async getUserById(id: string): Promise<User | null> {
    return getUserDao().findById(id);
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    return getUserDao().findByEmail(email);
  }

  static async getAllUsers(): Promise<User[]> {
    return getUserDao().findAll();
  }

  static async updateUser(id: string, user: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User> {
    return getUserDao().update(id, user);
  }

  static async deleteUser(id: string): Promise<void> {
    return getUserDao().delete(id);
  }
} 