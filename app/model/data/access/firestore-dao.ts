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
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { db } from './firebase';
import type { UserDao } from './dao';
import type { User, Gender, Domain, UnitType, Unit, AgeGroup, Event, Submission } from '../../types';
import type { UserDto, GenderDto, DomainDto, UnitTypeDto, UnitDto, AgeGroupDto, EventDto, SubmissionDto } from '../transfer/dtos';
import { GENDERS, DOMAINS } from '../../types';

// Type guard for gender object
function isGenderObject(g: any): g is { value: string } {
  return typeof g === 'object' && g !== null && 'value' in g;
}

// Helper to get domain logo from DOMAINS constant
function getDomainLogo(domainValue: string): string {
  const domain = DOMAINS.find(d => d.value === domainValue);
  return domain?.logo || 'GiCog'; // Default fallback logo
}

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
      
      const dto = { id: doc.id, ...rawData } as TDto;
      
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
    // Hydrate the gender object from local constants
    let gender = undefined;
    if (dto.gender) {
      if (typeof dto.gender === 'string') {
        gender = GENDERS.find(g => g.value === dto.gender);
      } else if (typeof dto.gender === 'object' && dto.gender !== null && 'value' in dto.gender) {
        // Safe to access value property since we've verified it exists
        gender = GENDERS.find(g => g.value === (dto.gender as any).value) || dto.gender;
      }
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

export class FirestoreGenderDao {
  private collectionName = 'genders';

  async create(gender: Omit<Gender, 'id'>): Promise<Gender> {
    const genderDto: Omit<GenderDto, 'id' | 'createdAt'> = {
      value: gender.value,
      label: gender.label
    };

    const docRef = await addDoc(collection(db, this.collectionName), {
      ...genderDto,
      createdAt: new Date()
    });

    return {
      id: docRef.id,
      value: gender.value,
      label: gender.label
    };
  }

  async findById(id: string): Promise<Gender | null> {
    const docRef = doc(db, this.collectionName, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data() as GenderDto;

    return {
      id: docSnap.id,
      value: data.value || '',
      label: data.label || ''
    };
  }

  async findByValue(value: string): Promise<Gender | null> {
    const q = query(
      collection(db, this.collectionName),
      where('value', '==', value)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    const data = doc.data() as GenderDto;

    return {
      id: doc.id,
      value: data.value || '',
      label: data.label || ''
    };
  }

  async findAll(): Promise<Gender[]> {
    const q = query(collection(db, this.collectionName), orderBy('label'));
    const querySnapshot = await getDocs(q);
    
    const genders: Gender[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data() as GenderDto;
      genders.push({
        id: doc.id,
        value: data.value || '',
        label: data.label || ''
      });
    });

    return genders;
  }

  async update(id: string, gender: Partial<Omit<Gender, 'id'>>): Promise<Gender> {
    const docRef = doc(db, this.collectionName, id);
    const updateData: Partial<GenderDto> = {};
    
    if (gender.value !== undefined) updateData.value = gender.value;
    if (gender.label !== undefined) updateData.label = gender.label;

    await updateDoc(docRef, updateData);

    // Return the updated gender
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error(`Gender with ID ${id} not found after update`);
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    await deleteDoc(docRef);
  }
}

export class FirestoreDomainDao {
  private collectionName = 'domains';

  async create(domain: Omit<Domain, 'id'>): Promise<Domain> {
    const domainDto: Omit<DomainDto, 'id' | 'createdAt'> = {
      label: domain.label,
      value: domain.value,
      mobileLabel: domain.mobileLabel || '',
    };

    const docRef = await addDoc(collection(db, this.collectionName), {
      ...domainDto,
      createdAt: new Date()
    });

    return {
      id: docRef.id,
      label: domain.label,
      value: domain.value,
      mobileLabel: domain.mobileLabel || '',
      logo: getDomainLogo(domain.value),
    };
  }

  async findById(id: string): Promise<Domain | null> {
    const docRef = doc(db, this.collectionName, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data() as DomainDto;

    return {
      id: docSnap.id,
      label: data.label || '',
      value: data.value || '',
      mobileLabel: data.mobileLabel || '',
      logo: getDomainLogo(data.value || ''),
    };
  }

  async findByValue(value: string): Promise<Domain | null> {
    const q = query(
      collection(db, this.collectionName),
      where('value', '==', value)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    const data = doc.data() as DomainDto;

    return {
      id: doc.id,
      label: data.label || '',
      value: data.value || '',
      mobileLabel: data.mobileLabel || '',
      logo: getDomainLogo(data.value || ''),
    };
  }

  async findAll(): Promise<Domain[]> {
    const q = query(collection(db, this.collectionName), orderBy('label'));
    const querySnapshot = await getDocs(q);
    
    const domains: Domain[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data() as DomainDto;
      domains.push({
        id: doc.id,
        label: data.label || '',
        value: data.value || '',
        mobileLabel: data.mobileLabel || '',
        logo: getDomainLogo(data.value || ''),
      });
    });

    return domains;
  }

  async update(id: string, domain: Partial<Omit<Domain, 'id'>>): Promise<Domain> {
    const docRef = doc(db, this.collectionName, id);
    const updateData: Partial<DomainDto> = {};
    
    if (domain.label !== undefined) updateData.label = domain.label;
    if (domain.value !== undefined) updateData.value = domain.value;
    if (domain.mobileLabel !== undefined) updateData.mobileLabel = domain.mobileLabel;

    await updateDoc(docRef, updateData);

    // Return the updated domain
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error(`Domain with ID ${id} not found after update`);
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    await deleteDoc(docRef);
  }
}

export class FirestoreUnitTypeDao {
  private collectionName = 'unitTypes';

  async create(unitType: Omit<UnitType, 'id'>): Promise<UnitType> {
    const unitTypeDto: Omit<UnitTypeDto, 'id' | 'createdAt'> = {
      label: unitType.label,
      value: unitType.value,
      units: unitType.units.map(unit => unit.value || unit.id || '')
    };

    const docRef = await addDoc(collection(db, this.collectionName), {
      ...unitTypeDto,
      createdAt: new Date()
    });

    return {
      id: docRef.id,
      label: unitType.label,
      value: unitType.value,
      units: unitType.units
    };
  }

  async findById(id: string): Promise<UnitType | null> {
    const docRef = doc(db, this.collectionName, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data() as UnitTypeDto;

    // Convert units array back to Unit objects
    const units = data.units?.map(unitValue => ({
      value: unitValue,
      label: unitValue // We'll need to fetch the actual label if needed
    })) || [];

    return {
      id: docSnap.id,
      label: data.label || '',
      value: data.value || '',
      units: units
    };
  }

  async findByValue(value: string): Promise<UnitType | null> {
    const q = query(
      collection(db, this.collectionName),
      where('value', '==', value)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    const data = doc.data() as UnitTypeDto;

    // Convert units array back to Unit objects
    const units = data.units?.map(unitValue => ({
      value: unitValue,
      label: unitValue // We'll need to fetch the actual label if needed
    })) || [];

    return {
      id: doc.id,
      label: data.label || '',
      value: data.value || '',
      units: units
    };
  }

  async findAll(): Promise<UnitType[]> {
    const q = query(collection(db, this.collectionName), orderBy('label'));
    const querySnapshot = await getDocs(q);
    
    const unitTypes: UnitType[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data() as UnitTypeDto;
      
      // Convert units array back to Unit objects
      const units = data.units?.map(unitValue => ({
        value: unitValue,
        label: unitValue // We'll need to fetch the actual label if needed
      })) || [];

      unitTypes.push({
        id: doc.id,
        label: data.label || '',
        value: data.value || '',
        units: units
      });
    });

    return unitTypes;
  }

  async update(id: string, unitType: Partial<Omit<UnitType, 'id'>>): Promise<UnitType> {
    const docRef = doc(db, this.collectionName, id);
    const updateData: Partial<UnitTypeDto> = {};
    
    if (unitType.label !== undefined) updateData.label = unitType.label;
    if (unitType.value !== undefined) updateData.value = unitType.value;
    if (unitType.units !== undefined) {
      updateData.units = unitType.units.map(unit => unit.value || unit.id || '');
    }

    await updateDoc(docRef, updateData);

    // Return the updated unitType
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error(`UnitType with ID ${id} not found after update`);
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    await deleteDoc(docRef);
  }
}

export class FirestoreUnitDao {
  private collectionName = 'units';

  async create(unit: Omit<Unit, 'id'>): Promise<Unit> {
    const unitDto: Omit<UnitDto, 'id' | 'createdAt'> = {
      label: unit.label,
      value: unit.value
    };

    const docRef = await addDoc(collection(db, this.collectionName), {
      ...unitDto,
      createdAt: new Date()
    });

    return {
      id: docRef.id,
      label: unit.label,
      value: unit.value
    };
  }

  async findById(id: string): Promise<Unit | null> {
    const docRef = doc(db, this.collectionName, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data() as UnitDto;

    return {
      id: docSnap.id,
      label: data.label || '',
      value: data.value || ''
    };
  }

  async findByValue(value: string): Promise<Unit | null> {
    const q = query(
      collection(db, this.collectionName),
      where('value', '==', value)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    const data = doc.data() as UnitDto;

    return {
      id: doc.id,
      label: data.label || '',
      value: data.value || ''
    };
  }

  async findAll(): Promise<Unit[]> {
    const q = query(collection(db, this.collectionName), orderBy('label'));
    const querySnapshot = await getDocs(q);
    
    const units: Unit[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data() as UnitDto;
      units.push({
        id: doc.id,
        label: data.label || '',
        value: data.value || ''
      });
    });

    return units;
  }

  async update(id: string, unit: Partial<Omit<Unit, 'id'>>): Promise<Unit> {
    const docRef = doc(db, this.collectionName, id);
    const updateData: Partial<UnitDto> = {};
    
    if (unit.label !== undefined) updateData.label = unit.label;
    if (unit.value !== undefined) updateData.value = unit.value;

    await updateDoc(docRef, updateData);

    // Return the updated unit
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error(`Unit with ID ${id} not found after update`);
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    await deleteDoc(docRef);
  }
}

export class FirestoreAgeGroupDao {
  private collectionName = 'ageGroups';

  async create(ageGroup: Omit<AgeGroup, 'id'>): Promise<AgeGroup> {
    const ageGroupDto: Omit<AgeGroupDto, 'id' | 'createdAt'> = {
      lowerBound: ageGroup.lowerBound,
      upperBound: ageGroup.upperBound
    };

    const docRef = await addDoc(collection(db, this.collectionName), {
      ...ageGroupDto,
      createdAt: new Date()
    });

    return {
      id: docRef.id,
      lowerBound: ageGroup.lowerBound,
      upperBound: ageGroup.upperBound
    };
  }

  async findById(id: string): Promise<AgeGroup | null> {
    const docRef = doc(db, this.collectionName, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data() as AgeGroupDto;

    return {
      id: docSnap.id,
      lowerBound: data.lowerBound || 0,
      upperBound: data.upperBound || 0
    };
  }

  async findByBounds(lowerBound: number, upperBound: number): Promise<AgeGroup | null> {
    const q = query(
      collection(db, this.collectionName),
      where('lowerBound', '==', lowerBound),
      where('upperBound', '==', upperBound)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    const data = doc.data() as AgeGroupDto;

    return {
      id: doc.id,
      lowerBound: data.lowerBound || 0,
      upperBound: data.upperBound || 0
    };
  }

  async findAll(): Promise<AgeGroup[]> {
    const q = query(collection(db, this.collectionName), orderBy('lowerBound', 'asc'));
    const querySnapshot = await getDocs(q);
    
    const ageGroups: AgeGroup[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data() as AgeGroupDto;
      ageGroups.push({
        id: doc.id,
        lowerBound: data.lowerBound || 0,
        upperBound: data.upperBound || 0
      });
    });

    return ageGroups;
  }

  async update(id: string, ageGroup: Partial<Omit<AgeGroup, 'id'>>): Promise<AgeGroup> {
    const docRef = doc(db, this.collectionName, id);
    const updateData: Partial<AgeGroupDto> = {};
    
    if (ageGroup.lowerBound !== undefined) updateData.lowerBound = ageGroup.lowerBound;
    if (ageGroup.upperBound !== undefined) updateData.upperBound = ageGroup.upperBound;

    await updateDoc(docRef, updateData);

    // Return the updated ageGroup
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error(`AgeGroup with ID ${id} not found after update`);
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    await deleteDoc(docRef);
  }
}

export class FirestoreEventDao {
  private collectionName = 'events';

  async create(event: Omit<Event, 'id'>): Promise<Event> {
    // Save only the string value for unitType and domain
    const eventDto: Omit<EventDto, 'id' | 'createdAt'> = {
      label: event.label,
      value: event.value,
      unitType: event.unitType.value,
      domain: event.domain.value,
      description: event.description
    };

    const docRef = await addDoc(collection(db, this.collectionName), {
      ...eventDto,
      createdAt: new Date()
    });

    // Return the event with string IDs for unitType and domain (to be hydrated by DataService)
    return {
      id: docRef.id,
      label: event.label,
      value: event.value,
      unitType: event.unitType.value,
      domain: event.domain.value,
      description: event.description
    } as unknown as Event; // DataService will hydrate to full objects
  }

  async findById(id: string): Promise<Event | null> {
    const docRef = doc(db, this.collectionName, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return null;
    }
    const data = docSnap.data() as EventDto;
    // Return the event with string IDs for unitType and domain (to be hydrated by DataService)
    return {
      id: docSnap.id,
      label: data.label || '',
      value: data.value || '',
      unitType: data.unitType || '',
      domain: data.domain || '',
      description: data.description
    } as unknown as Event;
  }

  async findByValue(value: string): Promise<Event | null> {
    const q = query(
      collection(db, this.collectionName),
      where('value', '==', value)
    );
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return null;
    }
    const doc = querySnapshot.docs[0];
    const data = doc.data() as EventDto;
    return {
      id: doc.id,
      label: data.label || '',
      value: data.value || '',
      unitType: data.unitType || '',
      domain: data.domain || '',
      description: data.description
    } as unknown as Event;
  }

  async findByDomain(domain: string): Promise<Event[]> {
    const q = query(
      collection(db, this.collectionName),
      where('domain', '==', domain),
      orderBy('label')
    );
    const querySnapshot = await getDocs(q);
    const events: Event[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data() as EventDto;
      events.push({
        id: doc.id,
        label: data.label || '',
        value: data.value || '',
        unitType: data.unitType || '',
        domain: data.domain || '',
        description: data.description
      } as unknown as Event);
    });
    return events;
  }

  async findAll(): Promise<Event[]> {
    const q = query(collection(db, this.collectionName), orderBy('domain'), orderBy('label'));
    const querySnapshot = await getDocs(q);
    const events: Event[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data() as EventDto;
      events.push({
        id: doc.id,
        label: data.label || '',
        value: data.value || '',
        unitType: data.unitType || '',
        domain: data.domain || '',
        description: data.description
      } as unknown as Event);
    });
    return events;
  }

  async update(id: string, event: Partial<Omit<Event, 'id'>>): Promise<Event> {
    const docRef = doc(db, this.collectionName, id);
    const updateData: Partial<EventDto> = {};
    if (event.label !== undefined) updateData.label = event.label;
    if (event.value !== undefined) updateData.value = event.value;
    if (event.unitType !== undefined) updateData.unitType = typeof event.unitType === 'string' ? event.unitType : event.unitType.value;
    if (event.domain !== undefined) updateData.domain = typeof event.domain === 'string' ? event.domain : event.domain.value;
    if (event.description !== undefined) updateData.description = event.description;
    await updateDoc(docRef, updateData);
    // Return the updated event with string IDs for unitType and domain
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error(`Event with ID ${id} not found after update`);
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    await deleteDoc(docRef);
  }
}

export class FirestoreSubmissionDao {
  private collectionName = 'submissions';

  async create(submission: Omit<Submission, 'id'>): Promise<Submission> {
    // Extract string IDs from full objects for DTO
    const submissionDto: Omit<SubmissionDto, 'id' | 'createdAt'> = {
      userId: submission.user.id || submission.user.email,
      event: submission.event.value,
      rawValue: submission.rawValue,
      value: submission.value, // Save the computed numeric value
      unit: submission.unit ? submission.unit.value : null
    };

    const docRef = await addDoc(collection(db, this.collectionName), {
      ...submissionDto,
      createdAt: new Date()
    });

    // Return with string IDs (to be hydrated by DataService)
    return {
      id: docRef.id,
      user: submissionDto.userId,
      event: submissionDto.event,
      rawValue: submission.rawValue,
      value: submission.value,
      unit: submissionDto.unit,
      createdAt: new Date()
    } as unknown as Submission;
  }

  async findById(id: string): Promise<Submission | null> {
    const docRef = doc(db, this.collectionName, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data() as SubmissionDto;
    // Return with string IDs (to be hydrated by DataService)
    return {
      id: docSnap.id,
      user: data.userId || '',
      event: data.event || '',
      rawValue: data.rawValue || '',
      value: data.value || 0, // Use stored value from Firestore
      unit: data.unit || null,
      createdAt: data.createdAt
    } as unknown as Submission;
  }

  async findByUserId(userId: string): Promise<Submission[]> {
    const q = query(
      collection(db, this.collectionName),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    const submissions: Submission[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data() as SubmissionDto;
      submissions.push({
        id: doc.id,
        user: data.userId || '',
        event: data.event || '',
        rawValue: data.rawValue || '',
        value: data.value || 0, // Use stored value from Firestore
        unit: data.unit || null,
        createdAt: data.createdAt
      } as unknown as Submission);
    });

    return submissions;
  }

  async findByEvent(event: string): Promise<Submission[]> {
    const q = query(
      collection(db, this.collectionName),
      where('event', '==', event),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    const submissions: Submission[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data() as SubmissionDto;
      submissions.push({
        id: doc.id,
        user: data.userId || '',
        event: data.event || '',
        rawValue: data.rawValue || '',
        value: data.value || 0, // Use stored value from Firestore
        unit: data.unit || null,
        createdAt: data.createdAt
      } as unknown as Submission);
    });

    return submissions;
  }

  async findAll(): Promise<Submission[]> {
    const q = query(collection(db, this.collectionName), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const submissions: Submission[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data() as SubmissionDto;
      submissions.push({
        id: doc.id,
        user: data.userId || '',
        event: data.event || '',
        rawValue: data.rawValue || '',
        value: data.value || 0, // Use stored value from Firestore
        unit: data.unit || null,
        createdAt: data.createdAt
      } as unknown as Submission);
    });

    return submissions;
  }

  async update(id: string, submission: Partial<Omit<Submission, 'id'>>): Promise<Submission> {
    const docRef = doc(db, this.collectionName, id);
    const updateData: Partial<SubmissionDto> = {};
    
    if (submission.user !== undefined) {
      updateData.userId = typeof submission.user === 'string' ? submission.user : submission.user.id || submission.user.email;
    }
    if (submission.event !== undefined) {
      updateData.event = typeof submission.event === 'string' ? submission.event : submission.event.value;
    }
    if (submission.rawValue !== undefined) updateData.rawValue = submission.rawValue;
    if (submission.value !== undefined) updateData.value = submission.value; // Update the computed numeric value
    if (submission.unit !== undefined) {
      updateData.unit = submission.unit ? (typeof submission.unit === 'string' ? submission.unit : submission.unit.value) : null;
    }

    await updateDoc(docRef, updateData);

    // Return the updated submission with string IDs
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error(`Submission with ID ${id} not found after update`);
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    await deleteDoc(docRef);
  }
} 