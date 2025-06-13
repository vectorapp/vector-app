export type User = {
  id: string; // Unique user identifier (e.g., email or UUID)
  name?: string;
  email: string;
  gender?: string;
  age?: number;
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

export type PopulationStats = {
  event: string;
  gender: string;
  ageGroup: string;
  mean: number;
  stddev: number;
};

export type NormalizedScore = {
  event: string;
  zScore: number;
  normalized: number; // e.g., 0-100 scale, 50 = average
  domain: string;
};

export type DomainScore = {
  domain: string;
  average: number;
  events: NormalizedScore[];
};

export type CoreScore = {
  value: number;
  domains: DomainScore[];
}; 