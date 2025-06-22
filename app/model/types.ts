export type Gender = {
  value: string;
  label: string;
};

export type AgeGroup = {
  lowerBound: number;
  upperBound: number;
};

export type User = {
  id: string; // Unique user identifier (e.g., email or UUID)
  firstName?: string;
  lastName?: string;
  email: string;
  gender?: Gender;
  birthday?: string; // ISO date string (YYYY-MM-DD)
  createdAt?: any; // Firestore Timestamp or Date
  // Add more fields as needed (e.g., profile image, role, etc.)
};

export type Domain = {
  label: string;
  value: string;
};

export type Unit = {
  label: string;
  value: string;
};

export type UnitType = {
  label: string;
  value: string;
  units: Unit[];
};

export type Event = {
  label: string;
  value: string;
  unitType: string;
  domain: string;
  description?: string;
};

export type Submission = {
  id?: string; // Firestore document ID (optional, for UI)
  event: string;
  value: number; // Raw value submitted by the user
  userId: string;
  domain: string;
  unit?: string;
  timestamp?: any; // Firestore Timestamp or Date
  notes?: string;
}; 