export type Gender = {
  id?: string; // Unique identifier
  value: string;
  label: string;
};

export type AgeGroup = {
  id?: string; // Unique identifier
  lowerBound: number;
  upperBound: number;
};

export type User = {
  id?: string; // Unique user identifier (e.g., email or UUID)
  firstName?: string;
  lastName?: string;
  email: string;
  gender?: Gender;
  birthday?: string; // ISO date string (YYYY-MM-DD)
  createdAt?: any; // Firestore Timestamp or Date
  // Add more fields as needed (e.g., profile image, role, etc.)
};

export type Domain = {
  id?: string; // Unique identifier
  label: string;
  value: string;
};

export type Unit = {
  id?: string; // Unique identifier
  label: string;
  value: string;
};

export type UnitType = {
  id?: string; // Unique identifier
  label: string;
  value: string;
  units: Unit[];
};

export type Event = {
  id?: string; // Unique identifier
  label: string;
  value: string;
  unitType: string;
  domain: string;
  description?: string;
};

export type Submission = {
  id?: string; // Firestore document ID (optional, for UI)
  userId: string;
  event: string;
  rawValue: string; // Original value as entered by user
  unit?: string | null; // Unit for non-time events, null for time events
}; 