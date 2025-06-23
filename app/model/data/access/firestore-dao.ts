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
import { db } from './firebase';
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
      const rawData = doc.data();
      console.log('[DataService] Raw Firestore data for user:', doc.id, rawData);
      
      const dto = { id: doc.id, ...rawData } as TDto;
      console.log('[DataService] Created DTO from raw data:', dto);
      
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
    console.log('[DataService] dtoToEntity called with DTO:', dto);
    console.log('[DataService] DTO gender field:', dto.gender);
    console.log('[DataService] DTO gender field type:', typeof dto.gender);
    
    // Fetch the gender object
    let gender = undefined;
    
    if (dto.gender) {
      console.log('[DataService] Looking for gender with value:', dto.gender);
      
      // Find gender document by matching the value field
      const gendersSnapshot = await getDocs(collection(db, 'genders'));
      const genderDoc = gendersSnapshot.docs.find(doc => {
        const data = doc.data() as GenderDto;
        return data.value === dto.gender;
      });
      
      console.log('[DataService] Found gender document:', genderDoc ? { id: genderDoc.id, data: genderDoc.data() } : null);
      
      if (genderDoc) {
        const genderData = genderDoc.data() as GenderDto;
        console.log('[DataService] Gender data:', genderData);
        
        if (genderData && genderData.value && genderData.label) {
          gender = {
            value: genderData.value,
            label: genderData.label
          };
          console.log('[DataService] Created gender object:', gender);
        } else {
          console.log('[DataService] Gender data incomplete or missing');
        }
      } else {
        console.log('[DataService] No gender document found with value:', dto.gender);
      }
    } else {
      console.log('[DataService] No gender field in DTO');
    }

    const result = {
      id: dto.id,
      createdAt: dto.createdAt,
      firstName: dto.firstName || '',
      lastName: dto.lastName || '',
      email: dto.email || '',
      gender,
      birthday: dto.birthday || ''
    };
    
    console.log('[DataService] Final User object:', result);
    return result;
  }

  protected async entityToDto(entity: Omit<User, 'id' | 'createdAt'>): Promise<Omit<UserDto, 'id' | 'createdAt'>> {
    return {
      firstName: entity.firstName,
      lastName: entity.lastName,
      email: entity.email,
      gender: entity.gender?.value || '',
      birthday: entity.birthday
    };
  }
} 