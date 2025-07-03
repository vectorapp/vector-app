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
  logo: string; // Icon component name for feed/scalar
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

export const DOMAINS = [
  {
    label: 'Agility & Coordination',
    value: 'agility-coordination',
    logo: 'GiBodyBalance',
  },
  {
    label: 'Anaerobic Power/Speed',
    value: 'anaerobic-power-speed',
    logo: 'GiSpeedometer',
  },
  {
    label: 'Muscular Endurance',
    value: 'muscular-endurance',
    logo: 'GiStairsGoal',
  },
  {
    label: 'Muscular Strength',
    value: 'muscular-strength',
    logo: 'GiBiceps',
  },
  {
    label: 'Olympic Lifting',
    value: 'olympic-lifting',
    logo: 'GiWeightLiftingUp',
  },
  {
    label: 'Steady State Endurance',
    value: 'steady-state-endurance',
    logo: 'GiPathDistance',
  },
] as const;

export type DomainValue = typeof DOMAINS[number]['value'];

export const UNITS = [
  { label: 'Calories', value: 'calories' },
  // { label: 'Centimeters', value: 'centimeters' },
  { label: 'Feet', value: 'feet' },
  { label: 'Inches', value: 'inches' },
  // { label: 'Kilograms', value: 'kilograms' },
  // { label: 'Meters', value: 'meters' },
  { label: 'Minutes', value: 'minutes' },
  { label: 'Pounds', value: 'pounds' },
  { label: 'Repetitions', value: 'repetitions' },
  { label: 'Seconds', value: 'seconds' },
  
] as const;

export type UnitValue = typeof UNITS[number]['value'];

export const UNIT_TYPES = [
  {
    label: 'Calories',
    value: 'calories',
    units: [UNITS.find(u => u.value === 'calories')!],
  },
  {
    label: 'Repetitions',
    value: 'repetitions',
    units: [UNITS.find(u => u.value === 'repetitions')!],
  },
  {
    label: 'Time',
    value: 'time',
    units: [UNITS.find(u => u.value === 'minutes')!, UNITS.find(u => u.value === 'seconds')!],
  },
  {
    label: 'Weight',
    value: 'weight',
    units: [UNITS.find(u => u.value === 'pounds')!],
  },
] as const;

export type UnitTypeValue = typeof UNIT_TYPES[number]['value'];

export const EVENTS = [
  {
    domain: DOMAINS.find(d => d.value === 'anaerobic-power-speed')!,
    label: '400m Sprint',
    value: '400m-sprint',
    unitType: UNIT_TYPES.find(u => u.value === 'time')!,
  },
  {
    domain: DOMAINS.find(d => d.value === 'anaerobic-power-speed')!,
    label: '60-Second Assault Bike for Max Calories',
    value: 'assault-bike',
    unitType: UNIT_TYPES.find(u => u.value === 'calories')!,
  },
  {
    domain: DOMAINS.find(d => d.value === 'muscular-endurance')!,
    label: 'Max Air Squats in 2 Minutes',
    value: 'air-squats',
    unitType: UNIT_TYPES.find(u => u.value === 'repetitions')!,
  },
  {
    domain: DOMAINS.find(d => d.value === 'muscular-endurance')!,
    label: 'Max Hanging Knee Raises in 2 Minutes',
    value: 'knee-raises',
    unitType: UNIT_TYPES.find(u => u.value === 'repetitions')!,
  },
  {
    domain: DOMAINS.find(d => d.value === 'muscular-endurance')!,
    label: 'Max Push-Ups in 2 Minutes',
    value: 'push-ups',
    unitType: UNIT_TYPES.find(u => u.value === 'repetitions')!,
  },
  {
    domain: DOMAINS.find(d => d.value === 'muscular-endurance')!,
    label: 'Max Strict Pull-Ups',
    value: 'pull-ups',
    unitType: UNIT_TYPES.find(u => u.value === 'repetitions')!,
  },
  {
    domain: DOMAINS.find(d => d.value === 'muscular-strength')!,
    label: 'Back Squat',
    value: 'back-squat',
    unitType: UNIT_TYPES.find(u => u.value === 'weight')!,
  },
  {
    domain: DOMAINS.find(d => d.value === 'muscular-strength')!,
    label: 'Deadlift',
    value: 'deadlift',
    unitType: UNIT_TYPES.find(u => u.value === 'weight')!,
  },
  {
    domain: DOMAINS.find(d => d.value === 'muscular-strength')!,
    label: 'Military Press',
    value: 'military-press',
    unitType: UNIT_TYPES.find(u => u.value === 'weight')!,
  },
  {
    domain: DOMAINS.find(d => d.value === 'olympic-lifting')!,
    label: 'Clean & Jerk',
    value: 'clean-and-jerk',
    unitType: UNIT_TYPES.find(u => u.value === 'weight')!,
  },
  {
    domain: DOMAINS.find(d => d.value === 'olympic-lifting')!,
    label: 'Snatch',
    value: 'snatch',
    unitType: UNIT_TYPES.find(u => u.value === 'weight')!,
  },
  {
    domain: DOMAINS.find(d => d.value === 'steady-state-endurance')!,
    label: '10K Row Time',
    value: '10k-row',
    unitType: UNIT_TYPES.find(u => u.value === 'time')!,
  },
  {
    domain: DOMAINS.find(d => d.value === 'steady-state-endurance')!,
    label: '5k Run',
    value: '5k-run',
    unitType: UNIT_TYPES.find(u => u.value === 'time')!,
  },
] as const;

export type EventValue = typeof EVENTS[number]['value'];

export const GENDERS = [
  { label: 'Female', value: 'female' },
  { label: 'Male', value: 'male' },
  { label: 'Non-Binary', value: 'non-binary' },
  { label: 'Prefer Not To Say', value: 'not-stated' },
] as const;

export type GenderValue = typeof GENDERS[number]['value'];

export const AGE_GROUPS = [
  { lowerBound: 18, upperBound: 29 },
  { lowerBound: 30, upperBound: 39 },
  { lowerBound: 40, upperBound: 49 },
  { lowerBound: 50, upperBound: 59 },
  { lowerBound: 60, upperBound: 69 },
  { lowerBound: 70, upperBound: 79 },
  { lowerBound: 80, upperBound: 89 },
  { lowerBound: 90, upperBound: 99 },
] as const;

export type AgeGroupKey = `${typeof AGE_GROUPS[number]['lowerBound']}-${typeof AGE_GROUPS[number]['upperBound']}`; 