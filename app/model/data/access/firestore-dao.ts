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

export class FirestoreGenderDao {
  private collectionName = 'genders';

  async create(gender: Omit<Gender, 'id'>): Promise<Gender> {
    console.log('[GenderDao] Creating gender:', gender);
    
    const genderDto: Omit<GenderDto, 'id' | 'createdAt'> = {
      value: gender.value,
      label: gender.label
    };

    const docRef = await addDoc(collection(db, this.collectionName), {
      ...genderDto,
      createdAt: new Date()
    });

    console.log('[GenderDao] Created gender with ID:', docRef.id);
    
    return {
      id: docRef.id,
      value: gender.value,
      label: gender.label
    };
  }

  async findById(id: string): Promise<Gender | null> {
    console.log('[GenderDao] Finding gender by ID:', id);
    
    const docRef = doc(db, this.collectionName, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      console.log('[GenderDao] Gender not found for ID:', id);
      return null;
    }

    const data = docSnap.data() as GenderDto;
    console.log('[GenderDao] Found gender:', { id, ...data });

    return {
      id: docSnap.id,
      value: data.value || '',
      label: data.label || ''
    };
  }

  async findByValue(value: string): Promise<Gender | null> {
    console.log('[GenderDao] Finding gender by value:', value);
    
    const q = query(
      collection(db, this.collectionName),
      where('value', '==', value)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('[GenderDao] No gender found for value:', value);
      return null;
    }

    const doc = querySnapshot.docs[0];
    const data = doc.data() as GenderDto;
    console.log('[GenderDao] Found gender by value:', { id: doc.id, ...data });

    return {
      id: doc.id,
      value: data.value || '',
      label: data.label || ''
    };
  }

  async findAll(): Promise<Gender[]> {
    console.log('[GenderDao] Finding all genders');
    
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

    console.log('[GenderDao] Found', genders.length, 'genders');
    return genders;
  }

  async update(id: string, gender: Partial<Omit<Gender, 'id'>>): Promise<Gender> {
    console.log('[GenderDao] Updating gender:', id, gender);
    
    const docRef = doc(db, this.collectionName, id);
    const updateData: Partial<GenderDto> = {};
    
    if (gender.value !== undefined) updateData.value = gender.value;
    if (gender.label !== undefined) updateData.label = gender.label;

    await updateDoc(docRef, updateData);
    console.log('[GenderDao] Updated gender:', id);

    // Return the updated gender
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error(`Gender with ID ${id} not found after update`);
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    console.log('[GenderDao] Deleting gender:', id);
    
    const docRef = doc(db, this.collectionName, id);
    await deleteDoc(docRef);
    console.log('[GenderDao] Deleted gender:', id);
  }
}

export class FirestoreDomainDao {
  private collectionName = 'domains';

  async create(domain: Omit<Domain, 'id'>): Promise<Domain> {
    console.log('[DomainDao] Creating domain:', domain);
    
    const domainDto: Omit<DomainDto, 'id' | 'createdAt'> = {
      label: domain.label,
      value: domain.value
    };

    const docRef = await addDoc(collection(db, this.collectionName), {
      ...domainDto,
      createdAt: new Date()
    });

    console.log('[DomainDao] Created domain with ID:', docRef.id);
    
    return {
      id: docRef.id,
      label: domain.label,
      value: domain.value
    };
  }

  async findById(id: string): Promise<Domain | null> {
    console.log('[DomainDao] Finding domain by ID:', id);
    
    const docRef = doc(db, this.collectionName, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      console.log('[DomainDao] Domain not found for ID:', id);
      return null;
    }

    const data = docSnap.data() as DomainDto;
    console.log('[DomainDao] Found domain:', { id, ...data });

    return {
      id: docSnap.id,
      label: data.label || '',
      value: data.value || ''
    };
  }

  async findByValue(value: string): Promise<Domain | null> {
    console.log('[DomainDao] Finding domain by value:', value);
    
    const q = query(
      collection(db, this.collectionName),
      where('value', '==', value)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('[DomainDao] No domain found for value:', value);
      return null;
    }

    const doc = querySnapshot.docs[0];
    const data = doc.data() as DomainDto;
    console.log('[DomainDao] Found domain by value:', { id: doc.id, ...data });

    return {
      id: doc.id,
      label: data.label || '',
      value: data.value || ''
    };
  }

  async findAll(): Promise<Domain[]> {
    console.log('[DomainDao] Finding all domains');
    
    const q = query(collection(db, this.collectionName), orderBy('label'));
    const querySnapshot = await getDocs(q);
    
    const domains: Domain[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data() as DomainDto;
      domains.push({
        id: doc.id,
        label: data.label || '',
        value: data.value || ''
      });
    });

    console.log('[DomainDao] Found', domains.length, 'domains');
    return domains;
  }

  async update(id: string, domain: Partial<Omit<Domain, 'id'>>): Promise<Domain> {
    console.log('[DomainDao] Updating domain:', id, domain);
    
    const docRef = doc(db, this.collectionName, id);
    const updateData: Partial<DomainDto> = {};
    
    if (domain.label !== undefined) updateData.label = domain.label;
    if (domain.value !== undefined) updateData.value = domain.value;

    await updateDoc(docRef, updateData);
    console.log('[DomainDao] Updated domain:', id);

    // Return the updated domain
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error(`Domain with ID ${id} not found after update`);
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    console.log('[DomainDao] Deleting domain:', id);
    
    const docRef = doc(db, this.collectionName, id);
    await deleteDoc(docRef);
    console.log('[DomainDao] Deleted domain:', id);
  }
}

export class FirestoreUnitTypeDao {
  private collectionName = 'unitTypes';

  async create(unitType: Omit<UnitType, 'id'>): Promise<UnitType> {
    console.log('[UnitTypeDao] Creating unitType:', unitType);
    
    const unitTypeDto: Omit<UnitTypeDto, 'id' | 'createdAt'> = {
      label: unitType.label,
      value: unitType.value,
      units: unitType.units.map(unit => unit.value || unit.id || '')
    };

    const docRef = await addDoc(collection(db, this.collectionName), {
      ...unitTypeDto,
      createdAt: new Date()
    });

    console.log('[UnitTypeDao] Created unitType with ID:', docRef.id);
    
    return {
      id: docRef.id,
      label: unitType.label,
      value: unitType.value,
      units: unitType.units
    };
  }

  async findById(id: string): Promise<UnitType | null> {
    console.log('[UnitTypeDao] Finding unitType by ID:', id);
    
    const docRef = doc(db, this.collectionName, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      console.log('[UnitTypeDao] UnitType not found for ID:', id);
      return null;
    }

    const data = docSnap.data() as UnitTypeDto;
    console.log('[UnitTypeDao] Found unitType:', { id, ...data });

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
    console.log('[UnitTypeDao] Finding unitType by value:', value);
    
    const q = query(
      collection(db, this.collectionName),
      where('value', '==', value)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('[UnitTypeDao] No unitType found for value:', value);
      return null;
    }

    const doc = querySnapshot.docs[0];
    const data = doc.data() as UnitTypeDto;
    console.log('[UnitTypeDao] Found unitType by value:', { id: doc.id, ...data });

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
    console.log('[UnitTypeDao] Finding all unitTypes');
    
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

    console.log('[UnitTypeDao] Found', unitTypes.length, 'unitTypes');
    return unitTypes;
  }

  async update(id: string, unitType: Partial<Omit<UnitType, 'id'>>): Promise<UnitType> {
    console.log('[UnitTypeDao] Updating unitType:', id, unitType);
    
    const docRef = doc(db, this.collectionName, id);
    const updateData: Partial<UnitTypeDto> = {};
    
    if (unitType.label !== undefined) updateData.label = unitType.label;
    if (unitType.value !== undefined) updateData.value = unitType.value;
    if (unitType.units !== undefined) {
      updateData.units = unitType.units.map(unit => unit.value || unit.id || '');
    }

    await updateDoc(docRef, updateData);
    console.log('[UnitTypeDao] Updated unitType:', id);

    // Return the updated unitType
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error(`UnitType with ID ${id} not found after update`);
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    console.log('[UnitTypeDao] Deleting unitType:', id);
    
    const docRef = doc(db, this.collectionName, id);
    await deleteDoc(docRef);
    console.log('[UnitTypeDao] Deleted unitType:', id);
  }
}

export class FirestoreUnitDao {
  private collectionName = 'units';

  async create(unit: Omit<Unit, 'id'>): Promise<Unit> {
    console.log('[UnitDao] Creating unit:', unit);
    
    const unitDto: Omit<UnitDto, 'id' | 'createdAt'> = {
      label: unit.label,
      value: unit.value
    };

    const docRef = await addDoc(collection(db, this.collectionName), {
      ...unitDto,
      createdAt: new Date()
    });

    console.log('[UnitDao] Created unit with ID:', docRef.id);
    
    return {
      id: docRef.id,
      label: unit.label,
      value: unit.value
    };
  }

  async findById(id: string): Promise<Unit | null> {
    console.log('[UnitDao] Finding unit by ID:', id);
    
    const docRef = doc(db, this.collectionName, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      console.log('[UnitDao] Unit not found for ID:', id);
      return null;
    }

    const data = docSnap.data() as UnitDto;
    console.log('[UnitDao] Found unit:', { id, ...data });

    return {
      id: docSnap.id,
      label: data.label || '',
      value: data.value || ''
    };
  }

  async findByValue(value: string): Promise<Unit | null> {
    console.log('[UnitDao] Finding unit by value:', value);
    
    const q = query(
      collection(db, this.collectionName),
      where('value', '==', value)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('[UnitDao] No unit found for value:', value);
      return null;
    }

    const doc = querySnapshot.docs[0];
    const data = doc.data() as UnitDto;
    console.log('[UnitDao] Found unit by value:', { id: doc.id, ...data });

    return {
      id: doc.id,
      label: data.label || '',
      value: data.value || ''
    };
  }

  async findAll(): Promise<Unit[]> {
    console.log('[UnitDao] Finding all units');
    
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

    console.log('[UnitDao] Found', units.length, 'units');
    return units;
  }

  async update(id: string, unit: Partial<Omit<Unit, 'id'>>): Promise<Unit> {
    console.log('[UnitDao] Updating unit:', id, unit);
    
    const docRef = doc(db, this.collectionName, id);
    const updateData: Partial<UnitDto> = {};
    
    if (unit.label !== undefined) updateData.label = unit.label;
    if (unit.value !== undefined) updateData.value = unit.value;

    await updateDoc(docRef, updateData);
    console.log('[UnitDao] Updated unit:', id);

    // Return the updated unit
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error(`Unit with ID ${id} not found after update`);
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    console.log('[UnitDao] Deleting unit:', id);
    
    const docRef = doc(db, this.collectionName, id);
    await deleteDoc(docRef);
    console.log('[UnitDao] Deleted unit:', id);
  }
}

export class FirestoreAgeGroupDao {
  private collectionName = 'ageGroups';

  async create(ageGroup: Omit<AgeGroup, 'id'>): Promise<AgeGroup> {
    console.log('[AgeGroupDao] Creating ageGroup:', ageGroup);
    
    const ageGroupDto: Omit<AgeGroupDto, 'id' | 'createdAt'> = {
      lowerBound: ageGroup.lowerBound,
      upperBound: ageGroup.upperBound
    };

    const docRef = await addDoc(collection(db, this.collectionName), {
      ...ageGroupDto,
      createdAt: new Date()
    });

    console.log('[AgeGroupDao] Created ageGroup with ID:', docRef.id);
    
    return {
      id: docRef.id,
      lowerBound: ageGroup.lowerBound,
      upperBound: ageGroup.upperBound
    };
  }

  async findById(id: string): Promise<AgeGroup | null> {
    console.log('[AgeGroupDao] Finding ageGroup by ID:', id);
    
    const docRef = doc(db, this.collectionName, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      console.log('[AgeGroupDao] AgeGroup not found for ID:', id);
      return null;
    }

    const data = docSnap.data() as AgeGroupDto;
    console.log('[AgeGroupDao] Found ageGroup:', { id, ...data });

    return {
      id: docSnap.id,
      lowerBound: data.lowerBound || 0,
      upperBound: data.upperBound || 0
    };
  }

  async findByBounds(lowerBound: number, upperBound: number): Promise<AgeGroup | null> {
    console.log('[AgeGroupDao] Finding ageGroup by bounds:', lowerBound, upperBound);
    
    const q = query(
      collection(db, this.collectionName),
      where('lowerBound', '==', lowerBound),
      where('upperBound', '==', upperBound)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('[AgeGroupDao] No ageGroup found for bounds:', lowerBound, upperBound);
      return null;
    }

    const doc = querySnapshot.docs[0];
    const data = doc.data() as AgeGroupDto;
    console.log('[AgeGroupDao] Found ageGroup by bounds:', { id: doc.id, ...data });

    return {
      id: doc.id,
      lowerBound: data.lowerBound || 0,
      upperBound: data.upperBound || 0
    };
  }

  async findAll(): Promise<AgeGroup[]> {
    console.log('[AgeGroupDao] Finding all ageGroups');
    
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

    console.log('[AgeGroupDao] Found', ageGroups.length, 'ageGroups');
    return ageGroups;
  }

  async update(id: string, ageGroup: Partial<Omit<AgeGroup, 'id'>>): Promise<AgeGroup> {
    console.log('[AgeGroupDao] Updating ageGroup:', id, ageGroup);
    
    const docRef = doc(db, this.collectionName, id);
    const updateData: Partial<AgeGroupDto> = {};
    
    if (ageGroup.lowerBound !== undefined) updateData.lowerBound = ageGroup.lowerBound;
    if (ageGroup.upperBound !== undefined) updateData.upperBound = ageGroup.upperBound;

    await updateDoc(docRef, updateData);
    console.log('[AgeGroupDao] Updated ageGroup:', id);

    // Return the updated ageGroup
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error(`AgeGroup with ID ${id} not found after update`);
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    console.log('[AgeGroupDao] Deleting ageGroup:', id);
    
    const docRef = doc(db, this.collectionName, id);
    await deleteDoc(docRef);
    console.log('[AgeGroupDao] Deleted ageGroup:', id);
  }
}

export class FirestoreEventDao {
  private collectionName = 'events';

  async create(event: Omit<Event, 'id'>): Promise<Event> {
    console.log('[EventDao] Creating event:', event);
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

    console.log('[EventDao] Created event with ID:', docRef.id);
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
    console.log('[EventDao] Finding event by ID:', id);
    const docRef = doc(db, this.collectionName, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      console.log('[EventDao] Event not found for ID:', id);
      return null;
    }
    const data = docSnap.data() as EventDto;
    console.log('[EventDao] Found event:', { id, ...data });
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
    console.log('[EventDao] Finding event by value:', value);
    const q = query(
      collection(db, this.collectionName),
      where('value', '==', value)
    );
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      console.log('[EventDao] No event found for value:', value);
      return null;
    }
    const doc = querySnapshot.docs[0];
    const data = doc.data() as EventDto;
    console.log('[EventDao] Found event by value:', { id: doc.id, ...data });
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
    console.log('[EventDao] Finding events by domain:', domain);
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
    console.log('[EventDao] Found', events.length, 'events for domain:', domain);
    return events;
  }

  async findAll(): Promise<Event[]> {
    console.log('[EventDao] Finding all events');
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
    console.log('[EventDao] Found', events.length, 'events');
    return events;
  }

  async update(id: string, event: Partial<Omit<Event, 'id'>>): Promise<Event> {
    console.log('[EventDao] Updating event:', id, event);
    const docRef = doc(db, this.collectionName, id);
    const updateData: Partial<EventDto> = {};
    if (event.label !== undefined) updateData.label = event.label;
    if (event.value !== undefined) updateData.value = event.value;
    if (event.unitType !== undefined) updateData.unitType = typeof event.unitType === 'string' ? event.unitType : event.unitType.value;
    if (event.domain !== undefined) updateData.domain = typeof event.domain === 'string' ? event.domain : event.domain.value;
    if (event.description !== undefined) updateData.description = event.description;
    await updateDoc(docRef, updateData);
    console.log('[EventDao] Updated event:', id);
    // Return the updated event with string IDs for unitType and domain
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error(`Event with ID ${id} not found after update`);
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    console.log('[EventDao] Deleting event:', id);
    
    const docRef = doc(db, this.collectionName, id);
    await deleteDoc(docRef);
    console.log('[EventDao] Deleted event:', id);
  }
}

export class FirestoreSubmissionDao {
  private collectionName = 'submissions';

  async create(submission: Omit<Submission, 'id'>): Promise<Submission> {
    console.log('[SubmissionDao] Creating submission:', submission);
    
    // Extract string IDs from full objects for DTO
    const submissionDto: Omit<SubmissionDto, 'id' | 'createdAt'> = {
      userId: submission.user.id || submission.user.email,
      event: submission.event.value,
      rawValue: submission.rawValue,
      unit: submission.unit ? submission.unit.value : null
    };

    const docRef = await addDoc(collection(db, this.collectionName), {
      ...submissionDto,
      createdAt: new Date()
    });

    console.log('[SubmissionDao] Created submission with ID:', docRef.id);
    
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
    console.log('[SubmissionDao] Finding submission by ID:', id);
    
    const docRef = doc(db, this.collectionName, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      console.log('[SubmissionDao] Submission not found for ID:', id);
      return null;
    }

    const data = docSnap.data() as SubmissionDto;
    console.log('[SubmissionDao] Found submission:', { id, ...data });

    // Return with string IDs (to be hydrated by DataService)
    return {
      id: docSnap.id,
      user: data.userId || '',
      event: data.event || '',
      rawValue: data.rawValue || '',
      value: 0, // Will be computed by DataService
      unit: data.unit || null,
      createdAt: data.createdAt
    } as unknown as Submission;
  }

  async findByUserId(userId: string): Promise<Submission[]> {
    console.log('[SubmissionDao] Finding submissions by userId:', userId);
    
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
        value: 0, // Will be computed by DataService
        unit: data.unit || null,
        createdAt: data.createdAt
      } as unknown as Submission);
    });

    console.log('[SubmissionDao] Found', submissions.length, 'submissions for userId:', userId);
    return submissions;
  }

  async findByEvent(event: string): Promise<Submission[]> {
    console.log('[SubmissionDao] Finding submissions by event:', event);
    
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
        value: 0, // Will be computed by DataService
        unit: data.unit || null,
        createdAt: data.createdAt
      } as unknown as Submission);
    });

    console.log('[SubmissionDao] Found', submissions.length, 'submissions for event:', event);
    return submissions;
  }

  async findAll(): Promise<Submission[]> {
    console.log('[SubmissionDao] Finding all submissions');
    
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
        value: 0, // Will be computed by DataService
        unit: data.unit || null,
        createdAt: data.createdAt
      } as unknown as Submission);
    });

    console.log('[SubmissionDao] Found', submissions.length, 'submissions');
    return submissions;
  }

  async update(id: string, submission: Partial<Omit<Submission, 'id'>>): Promise<Submission> {
    console.log('[SubmissionDao] Updating submission:', id, submission);
    
    const docRef = doc(db, this.collectionName, id);
    const updateData: Partial<SubmissionDto> = {};
    
    if (submission.user !== undefined) {
      updateData.userId = typeof submission.user === 'string' ? submission.user : submission.user.id || submission.user.email;
    }
    if (submission.event !== undefined) {
      updateData.event = typeof submission.event === 'string' ? submission.event : submission.event.value;
    }
    if (submission.rawValue !== undefined) updateData.rawValue = submission.rawValue;
    if (submission.unit !== undefined) {
      updateData.unit = submission.unit ? (typeof submission.unit === 'string' ? submission.unit : submission.unit.value) : null;
    }

    await updateDoc(docRef, updateData);
    console.log('[SubmissionDao] Updated submission:', id);

    // Return the updated submission with string IDs
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error(`Submission with ID ${id} not found after update`);
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    console.log('[SubmissionDao] Deleting submission:', id);
    
    const docRef = doc(db, this.collectionName, id);
    await deleteDoc(docRef);
    console.log('[SubmissionDao] Deleted submission:', id);
  }
} 