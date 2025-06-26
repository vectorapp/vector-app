import { FirestoreUserDao, FirestoreGenderDao, FirestoreDomainDao, FirestoreUnitTypeDao, FirestoreUnitDao, FirestoreAgeGroupDao, FirestoreEventDao, FirestoreSubmissionDao } from './firestore-dao';
import type { User, Gender, Domain, UnitType, Unit, AgeGroup, Event, Submission } from '../../types';

// Singleton instances of the DAOs
let userDao: FirestoreUserDao | null = null;
let genderDao: FirestoreGenderDao | null = null;
let domainDao: FirestoreDomainDao | null = null;
let unitTypeDao: FirestoreUnitTypeDao | null = null;
let unitDao: FirestoreUnitDao | null = null;
let ageGroupDao: FirestoreAgeGroupDao | null = null;
let eventDao: FirestoreEventDao | null = null;
let submissionDao: FirestoreSubmissionDao | null = null;

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

function getUnitTypeDao(): FirestoreUnitTypeDao {
  if (!unitTypeDao) {
    unitTypeDao = new FirestoreUnitTypeDao();
  }
  return unitTypeDao;
}

function getUnitDao(): FirestoreUnitDao {
  if (!unitDao) {
    unitDao = new FirestoreUnitDao();
  }
  return unitDao;
}

function getAgeGroupDao(): FirestoreAgeGroupDao {
  if (!ageGroupDao) {
    ageGroupDao = new FirestoreAgeGroupDao();
  }
  return ageGroupDao;
}

function getEventDao(): FirestoreEventDao {
  if (!eventDao) {
    eventDao = new FirestoreEventDao();
  }
  return eventDao;
}

function getSubmissionDao(): FirestoreSubmissionDao {
  if (!submissionDao) {
    submissionDao = new FirestoreSubmissionDao();
  }
  return submissionDao;
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

  // UnitType operations
  static async createUnitType(unitType: Omit<UnitType, 'id'>): Promise<UnitType> {
    return getUnitTypeDao().create(unitType);
  }

  static async getUnitTypeById(id: string): Promise<UnitType | null> {
    return getUnitTypeDao().findById(id);
  }

  static async getUnitTypeByValue(value: string): Promise<UnitType | null> {
    return getUnitTypeDao().findByValue(value);
  }

  static async getAllUnitTypes(): Promise<UnitType[]> {
    return getUnitTypeDao().findAll();
  }

  static async updateUnitType(id: string, unitType: Partial<Omit<UnitType, 'id'>>): Promise<UnitType> {
    return getUnitTypeDao().update(id, unitType);
  }

  static async deleteUnitType(id: string): Promise<void> {
    return getUnitTypeDao().delete(id);
  }

  // Unit operations
  static async createUnit(unit: Omit<Unit, 'id'>): Promise<Unit> {
    return getUnitDao().create(unit);
  }

  static async getUnitById(id: string): Promise<Unit | null> {
    return getUnitDao().findById(id);
  }

  static async getUnitByValue(value: string): Promise<Unit | null> {
    return getUnitDao().findByValue(value);
  }

  static async getAllUnits(): Promise<Unit[]> {
    return getUnitDao().findAll();
  }

  static async updateUnit(id: string, unit: Partial<Omit<Unit, 'id'>>): Promise<Unit> {
    return getUnitDao().update(id, unit);
  }

  static async deleteUnit(id: string): Promise<void> {
    return getUnitDao().delete(id);
  }

  // AgeGroup operations
  static async createAgeGroup(ageGroup: Omit<AgeGroup, 'id'>): Promise<AgeGroup> {
    return getAgeGroupDao().create(ageGroup);
  }

  static async getAgeGroupById(id: string): Promise<AgeGroup | null> {
    return getAgeGroupDao().findById(id);
  }

  static async getAgeGroupByBounds(lowerBound: number, upperBound: number): Promise<AgeGroup | null> {
    return getAgeGroupDao().findByBounds(lowerBound, upperBound);
  }

  static async getAllAgeGroups(): Promise<AgeGroup[]> {
    return getAgeGroupDao().findAll();
  }

  static async updateAgeGroup(id: string, ageGroup: Partial<Omit<AgeGroup, 'id'>>): Promise<AgeGroup> {
    return getAgeGroupDao().update(id, ageGroup);
  }

  static async deleteAgeGroup(id: string): Promise<void> {
    return getAgeGroupDao().delete(id);
  }

  // Event operations (hydrated)
  static async createEvent(event: Omit<Event, 'id'>): Promise<Event> {
    return getEventDao().create(event);
  }

  static async getEventById(id: string): Promise<Event | null> {
    const event = await getEventDao().findById(id);
    if (!event) return null;
    
    // Hydrate the event with full objects
    const [unitTypes, domains] = await Promise.all([
      this.getAllUnitTypes(),
      this.getAllDomains()
    ]);
    
    const unitType = unitTypes.find(u => u.value === (event as any).unitType || u.id === (event as any).unitType);
    const domain = domains.find(d => d.value === (event as any).domain || d.id === (event as any).domain);
    
    return {
      ...event,
      unitType: unitType!,
      domain: domain!
    };
  }

  static async getEventByValue(value: string): Promise<Event | null> {
    const event = await getEventDao().findByValue(value);
    if (!event) return null;
    
    // Hydrate the event with full objects
    const [unitTypes, domains] = await Promise.all([
      this.getAllUnitTypes(),
      this.getAllDomains()
    ]);
    
    const unitType = unitTypes.find(u => u.value === (event as any).unitType || u.id === (event as any).unitType);
    const domain = domains.find(d => d.value === (event as any).domain || d.id === (event as any).domain);
    
    return {
      ...event,
      unitType: unitType!,
      domain: domain!
    };
  }

  static async getEventsByDomain(domainValue: string): Promise<Event[]> {
    const events = await getEventDao().findByDomain(domainValue);
    
    // Hydrate all events with full objects
    const [unitTypes, domains] = await Promise.all([
      this.getAllUnitTypes(),
      this.getAllDomains()
    ]);
    
    return events.map(event => {
      const unitType = unitTypes.find(u => u.value === (event as any).unitType || u.id === (event as any).unitType);
      const domain = domains.find(d => d.value === (event as any).domain || d.id === (event as any).domain);
      
      return {
        ...event,
        unitType: unitType!,
        domain: domain!
      };
    });
  }

  static async getAllEvents(): Promise<Event[]> {
    const events = await getEventDao().findAll();
    
    // Hydrate all events with full objects
    const [unitTypes, domains] = await Promise.all([
      this.getAllUnitTypes(),
      this.getAllDomains()
    ]);
    
    return events.map(event => {
      const unitType = unitTypes.find(u => u.value === (event as any).unitType || u.id === (event as any).unitType);
      const domain = domains.find(d => d.value === (event as any).domain || d.id === (event as any).domain);
      
      return {
        ...event,
        unitType: unitType!,
        domain: domain!
      };
    });
  }

  static async updateEvent(id: string, event: Partial<Omit<Event, 'id'>>): Promise<Event> {
    return getEventDao().update(id, event);
  }

  static async deleteEvent(id: string): Promise<void> {
    return getEventDao().delete(id);
  }

  // Submission operations (hydrated)
  static async createSubmission(submission: Omit<Submission, 'id'>): Promise<Submission> {
    return getSubmissionDao().create(submission);
  }

  static async getSubmissionById(id: string): Promise<Submission | null> {
    const submission = await getSubmissionDao().findById(id);
    if (!submission) return null;
    
    // Hydrate the submission with full objects
    const [users, events, units] = await Promise.all([
      this.getAllUsers(),
      this.getAllEvents(),
      this.getAllUnits()
    ]);
    
    const user = users.find(u => u.id === (submission as any).user || u.email === (submission as any).user);
    const event = events.find(e => e.value === (submission as any).event || e.id === (submission as any).event);
    const unit = (submission as any).unit ? units.find(u => u.value === (submission as any).unit || u.id === (submission as any).unit) : null;
    
    return {
      ...submission,
      user: user!,
      event: event!,
      unit: unit || null
    };
  }

  static async getSubmissionsByUserId(userId: string): Promise<Submission[]> {
    const submissions = await getSubmissionDao().findByUserId(userId);
    
    // Hydrate all submissions with full objects
    const [users, events, units] = await Promise.all([
      this.getAllUsers(),
      this.getAllEvents(),
      this.getAllUnits()
    ]);
    
    return submissions.map(submission => {
      const user = users.find(u => u.id === (submission as any).user || u.email === (submission as any).user);
      const event = events.find(e => e.value === (submission as any).event || e.id === (submission as any).event);
      const unit = (submission as any).unit ? units.find(u => u.value === (submission as any).unit || u.id === (submission as any).unit) : null;
      
      return {
        ...submission,
        user: user!,
        event: event!,
        unit: unit || null
      };
    });
  }

  static async getSubmissionsByEvent(eventValue: string): Promise<Submission[]> {
    const submissions = await getSubmissionDao().findByEvent(eventValue);
    
    // Hydrate all submissions with full objects
    const [users, events, units] = await Promise.all([
      this.getAllUsers(),
      this.getAllEvents(),
      this.getAllUnits()
    ]);
    
    return submissions.map(submission => {
      const user = users.find(u => u.id === (submission as any).user || u.email === (submission as any).user);
      const event = events.find(e => e.value === (submission as any).event || e.id === (submission as any).event);
      const unit = (submission as any).unit ? units.find(u => u.value === (submission as any).unit || u.id === (submission as any).unit) : null;
      
      return {
        ...submission,
        user: user!,
        event: event!,
        unit: unit || null
      };
    });
  }

  static async getAllSubmissions(): Promise<Submission[]> {
    const submissions = await getSubmissionDao().findAll();
    
    // Hydrate all submissions with full objects
    const [users, events, units] = await Promise.all([
      this.getAllUsers(),
      this.getAllEvents(),
      this.getAllUnits()
    ]);
    
    return submissions.map(submission => {
      const user = users.find(u => u.id === (submission as any).user || u.email === (submission as any).user);
      const event = events.find(e => e.value === (submission as any).event || e.id === (submission as any).event);
      const unit = (submission as any).unit ? units.find(u => u.value === (submission as any).unit || u.id === (submission as any).unit) : null;
      
      return {
        ...submission,
        user: user!,
        event: event!,
        unit: unit || null
      };
    });
  }

  static async updateSubmission(id: string, submission: Partial<Omit<Submission, 'id'>>): Promise<Submission> {
    return getSubmissionDao().update(id, submission);
  }

  static async deleteSubmission(id: string): Promise<void> {
    return getSubmissionDao().delete(id);
  }
} 