import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../../firebase';
import type { UserDao } from './dao';
import type { User } from '../../types';
import type { UserDto, GenderDto } from '../transfer/dtos';

// Base Firestore DAO implementation
abstract class BaseFirestoreDao<T, TDto> {
  protected collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  protected getCollection() {
    return collection(db, this.collectionName);
  }

  protected async dtoToEntity(dto: TDto): Promise<T> {
    throw new Error('dtoToEntity must be implemented by subclass');
  }

  protected async entityToDto(entity: Omit<T, 'id' | 'createdAt'>): Promise<Omit<TDto, 'id' | 'createdAt'>> {
    throw new Error('entityToDto must be implemented by subclass');
  }

  async create(item: Omit<T, 'id' | 'createdAt'>): Promise<T> {
    const dto = await this.entityToDto(item);
    const docRef = await addDoc(this.getCollection(), {
      ...dto,
      createdAt: serverTimestamp()
    });
    return this.findById(docRef.id) as Promise<T>;
  }

  async findById(id: string): Promise<T | null> {
    const docRef = doc(db, this.collectionName, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }

    const dto = { id: docSnap.id, ...docSnap.data() } as TDto;
    return this.dtoToEntity(dto);
  }

  async findAll(): Promise<T[]> {
    const querySnapshot = await getDocs(this.getCollection());
    const entities: T[] = [];
    
    for (const doc of querySnapshot.docs) {
      const dto = { id: doc.id, ...doc.data() } as TDto;
      const entity = await this.dtoToEntity(dto);
      entities.push(entity);
    }
    
    return entities;
  }

  async update(id: string, item: Partial<Omit<T, 'id' | 'createdAt'>>): Promise<T> {
    const docRef = doc(db, this.collectionName, id);
    const dto = await this.entityToDto(item as Omit<T, 'id' | 'createdAt'>);
    await updateDoc(docRef, dto);
    return this.findById(id) as Promise<T>;
  }

  async delete(id: string): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    await deleteDoc(docRef);
  }
}

// Firestore User DAO implementation
export class FirestoreUserDao extends BaseFirestoreDao<User, UserDto> implements UserDao {
  constructor() {
    super('users');
  }

  async findByEmail(email: string): Promise<User | null> {
    const q = query(this.getCollection(), where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    const dto = { id: doc.id, ...doc.data() } as UserDto;
    return this.dtoToEntity(dto);
  }

  protected async dtoToEntity(dto: UserDto): Promise<User> {
    // Fetch the gender object
    const genderDoc = await getDoc(doc(db, 'genders', dto.genderId));
    const genderData = genderDoc.exists() ? genderDoc.data() as GenderDto : null;
    
    const gender = genderData ? {
      value: genderData.value,
      label: genderData.label
    } : undefined;

    return {
      id: dto.id,
      createdAt: dto.createdAt,
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      gender,
      birthday: dto.birthday
    };
  }

  protected async entityToDto(entity: Omit<User, 'id' | 'createdAt'>): Promise<Omit<UserDto, 'id' | 'createdAt'>> {
    return {
      firstName: entity.firstName,
      lastName: entity.lastName,
      email: entity.email,
      genderId: entity.gender?.value || '',
      birthday: entity.birthday
    };
  }
} 