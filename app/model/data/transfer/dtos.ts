export type UserDto = {
  id?: string; // Unique identifier
  createdAt?: any; // Firestore Timestamp or Date
  firstName?: string;
  lastName?: string;
  email: string;
  genderId?: string; // Reference to gender instead of embedded object
  birthday?: string; // ISO date string (YYYY-MM-DD)
};

export type GenderDto = {
  id?: string; // Unique identifier
  createdAt?: any; // Firestore Timestamp or Date
  value?: string;
  label?: string;
}; 