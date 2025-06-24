import { FirestoreUserDao, FirestoreGenderDao, FirestoreDomainDao } from './firestore-dao';
import type { User, Gender, Domain } from '../../types';

// Singleton instances of the DAOs
let userDao: FirestoreUserDao | null = null;
let genderDao: FirestoreGenderDao | null = null;
let domainDao: FirestoreDomainDao | null = null;

function getUserDao(): FirestoreUserDao {
  if (!userDao) {
    userDao = new FirestoreUserDao();
  }
  return userDao;
}

function getGenderDao(): FirestoreGenderDao {
  if (!genderDao) {
    genderDao = new FirestoreGenderDao();
  }
  return genderDao;
}

function getDomainDao(): FirestoreDomainDao {
  if (!domainDao) {
    domainDao = new FirestoreDomainDao();
  }
  return domainDao;
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

  // Gender operations
  static async createGender(gender: Omit<Gender, 'id'>): Promise<Gender> {
    return getGenderDao().create(gender);
  }

  static async getGenderById(id: string): Promise<Gender | null> {
    return getGenderDao().findById(id);
  }

  static async getGenderByValue(value: string): Promise<Gender | null> {
    return getGenderDao().findByValue(value);
  }

  static async getAllGenders(): Promise<Gender[]> {
    return getGenderDao().findAll();
  }

  static async updateGender(id: string, gender: Partial<Omit<Gender, 'id'>>): Promise<Gender> {
    return getGenderDao().update(id, gender);
  }

  static async deleteGender(id: string): Promise<void> {
    return getGenderDao().delete(id);
  }

  // Domain operations
  static async createDomain(domain: Omit<Domain, 'id'>): Promise<Domain> {
    return getDomainDao().create(domain);
  }

  static async getDomainById(id: string): Promise<Domain | null> {
    return getDomainDao().findById(id);
  }

  static async getDomainByValue(value: string): Promise<Domain | null> {
    return getDomainDao().findByValue(value);
  }

  static async getAllDomains(): Promise<Domain[]> {
    return getDomainDao().findAll();
  }

  static async updateDomain(id: string, domain: Partial<Omit<Domain, 'id'>>): Promise<Domain> {
    return getDomainDao().update(id, domain);
  }

  static async deleteDomain(id: string): Promise<void> {
    return getDomainDao().delete(id);
  }
} 