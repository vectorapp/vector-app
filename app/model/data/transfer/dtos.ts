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