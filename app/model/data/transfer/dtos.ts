export type UserDto = {
  id?: string; // Unique identifier
  createdAt?: any; // Firestore Timestamp or Date
  firstName?: string;
  lastName?: string;
  email: string; // Required field
  gender?: string; // Reference to gender instead of embedded object (matches Firestore field name)
  birthday?: string; // ISO date string (YYYY-MM-DD)
};

export type GenderDto = {
  id?: string; // Unique identifier
  createdAt?: any; // Firestore Timestamp or Date
  value?: string;
  label?: string;
};

export type DomainDto = {
  id?: string; // Unique identifier
  createdAt?: any; // Firestore Timestamp or Date
  label?: string;
  value?: string;
};

export type UnitDto = {
  id?: string; // Unique identifier
  createdAt?: any; // Firestore Timestamp or Date
  label?: string;
  value?: string;
};

export type UnitTypeDto = {
  id?: string; // Unique identifier
  createdAt?: any; // Firestore Timestamp or Date
  label?: string;
  value?: string;
  units?: string[]; // Array of unit IDs or values
};

export type AgeGroupDto = {
  id?: string; // Unique identifier
  createdAt?: any; // Firestore Timestamp or Date
  lowerBound?: number;
  upperBound?: number;
};

export type EventDto = {
  id?: string; // Unique identifier
  createdAt?: any; // Firestore Timestamp or Date
  label?: string;
  value?: string;
  unitType?: string;
  domain?: string;
  description?: string;
};

export type SubmissionDto = {
  id?: string; // Unique identifier
  createdAt?: any; // Firestore Timestamp or Date
  userId?: string;
  event?: string;
  rawValue?: string;
  unit?: string | null; // Allow null for Firestore compatibility
}; 