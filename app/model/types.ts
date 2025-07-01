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
  mobileLabel?: string; // Short label for mobile/radar viz
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
  unitType: UnitType; // Full UnitType object
  domain: Domain; // Full Domain object
  description?: string;
};

export type Submission = {
  id?: string; // Firestore document ID (optional, for UI)
  user: User; // Full User object
  event: Event; // Full Event object
  rawValue: string; // Original value as entered by user
  value: number; // Business logic value (seconds for time, number for others)
  unit?: Unit | null; // Full Unit object for non-time events, null for time events
  createdAt?: any; // Firestore Timestamp or Date
}; 