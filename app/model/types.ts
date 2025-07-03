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
    label: 'Energy',
    value: 'energy',
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
    unitType: UNIT_TYPES.find(u => u.value === 'energy')!,
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
  { id: 'gender_female', label: 'Female', value: 'female' },
  { id: 'gender_male', label: 'Male', value: 'male' },
  // { id: 'gender_non_binary', label: 'Non-Binary', value: 'non-binary' },
  // { id: 'gender_not_stated', label: 'Prefer Not To Say', value: 'not-stated' },
] as const;

export type GenderValue = typeof GENDERS[number]['value'];

export const AGE_GROUPS = [
  { id: 'age_under_18', lowerBound: 0, upperBound: 17 },
  { id: 'age_18_29', lowerBound: 18, upperBound: 29 },
  { id: 'age_30_39', lowerBound: 30, upperBound: 39 },
  { id: 'age_40_49', lowerBound: 40, upperBound: 49 },
  { id: 'age_50_59', lowerBound: 50, upperBound: 59 },
  { id: 'age_60_69', lowerBound: 60, upperBound: 69 },
  { id: 'age_70_79', lowerBound: 70, upperBound: 79 },
  { id: 'age_80_89', lowerBound: 80, upperBound: 89 },
  { id: 'age_90_99', lowerBound: 90, upperBound: 99 },
] as const;

export type AgeGroupKey = `${typeof AGE_GROUPS[number]['lowerBound']}-${typeof AGE_GROUPS[number]['upperBound']}`;

// Cohorts: all gender and age group permutations
export const COHORTS = [
  // female
  { key: 'female_under_18', gender: GENDERS.find(g => g.id === 'gender_female')!, age: AGE_GROUPS.find(a => a.id === 'age_under_18')! },
  { key: 'female_18_29', gender: GENDERS.find(g => g.id === 'gender_female')!, age: AGE_GROUPS.find(a => a.id === 'age_18_29')! },
  { key: 'female_30_39', gender: GENDERS.find(g => g.id === 'gender_female')!, age: AGE_GROUPS.find(a => a.id === 'age_30_39')! },
  { key: 'female_40_49', gender: GENDERS.find(g => g.id === 'gender_female')!, age: AGE_GROUPS.find(a => a.id === 'age_40_49')! },
  { key: 'female_50_59', gender: GENDERS.find(g => g.id === 'gender_female')!, age: AGE_GROUPS.find(a => a.id === 'age_50_59')! },
  { key: 'female_60_69', gender: GENDERS.find(g => g.id === 'gender_female')!, age: AGE_GROUPS.find(a => a.id === 'age_60_69')! },
  { key: 'female_70_79', gender: GENDERS.find(g => g.id === 'gender_female')!, age: AGE_GROUPS.find(a => a.id === 'age_70_79')! },
  { key: 'female_80_89', gender: GENDERS.find(g => g.id === 'gender_female')!, age: AGE_GROUPS.find(a => a.id === 'age_80_89')! },
  { key: 'female_90_99', gender: GENDERS.find(g => g.id === 'gender_female')!, age: AGE_GROUPS.find(a => a.id === 'age_90_99')! },
  // male
  { key: 'male_under_18', gender: GENDERS.find(g => g.id === 'gender_male')!, age: AGE_GROUPS.find(a => a.id === 'age_under_18')! },
  { key: 'male_18_29', gender: GENDERS.find(g => g.id === 'gender_male')!, age: AGE_GROUPS.find(a => a.id === 'age_18_29')! },
  { key: 'male_30_39', gender: GENDERS.find(g => g.id === 'gender_male')!, age: AGE_GROUPS.find(a => a.id === 'age_30_39')! },
  { key: 'male_40_49', gender: GENDERS.find(g => g.id === 'gender_male')!, age: AGE_GROUPS.find(a => a.id === 'age_40_49')! },
  { key: 'male_50_59', gender: GENDERS.find(g => g.id === 'gender_male')!, age: AGE_GROUPS.find(a => a.id === 'age_50_59')! },
  { key: 'male_60_69', gender: GENDERS.find(g => g.id === 'gender_male')!, age: AGE_GROUPS.find(a => a.id === 'age_60_69')! },
  { key: 'male_70_79', gender: GENDERS.find(g => g.id === 'gender_male')!, age: AGE_GROUPS.find(a => a.id === 'age_70_79')! },
  { key: 'male_80_89', gender: GENDERS.find(g => g.id === 'gender_male')!, age: AGE_GROUPS.find(a => a.id === 'age_80_89')! },
  { key: 'male_90_99', gender: GENDERS.find(g => g.id === 'gender_male')!, age: AGE_GROUPS.find(a => a.id === 'age_90_99')! },
  /*
  // non-binary
  { key: 'non-binary_18_29', gender: GENDERS.find(g => g.id === 'gender_non_binary')!, age: AGE_GROUPS.find(a => a.id === 'age_18_29')! },
  { key: 'non-binary_30_39', gender: GENDERS.find(g => g.id === 'gender_non_binary')!, age: AGE_GROUPS.find(a => a.id === 'age_30_39')! },
  { key: 'non-binary_40_49', gender: GENDERS.find(g => g.id === 'gender_non_binary')!, age: AGE_GROUPS.find(a => a.id === 'age_40_49')! },
  { key: 'non-binary_50_59', gender: GENDERS.find(g => g.id === 'gender_non_binary')!, age: AGE_GROUPS.find(a => a.id === 'age_50_59')! },
  { key: 'non-binary_60_69', gender: GENDERS.find(g => g.id === 'gender_non_binary')!, age: AGE_GROUPS.find(a => a.id === 'age_60_69')! },
  { key: 'non-binary_70_79', gender: GENDERS.find(g => g.id === 'gender_non_binary')!, age: AGE_GROUPS.find(a => a.id === 'age_70_79')! },
  { key: 'non-binary_80_89', gender: GENDERS.find(g => g.id === 'gender_non_binary')!, age: AGE_GROUPS.find(a => a.id === 'age_80_89')! },
  { key: 'non-binary_90_99', gender: GENDERS.find(g => g.id === 'gender_non_binary')!, age: AGE_GROUPS.find(a => a.id === 'age_90_99')! },
  // not-stated
  { key: 'not-stated_18_29', gender: GENDERS.find(g => g.id === 'gender_not_stated')!, age: AGE_GROUPS.find(a => a.id === 'age_18_29')! },
  { key: 'not-stated_30_39', gender: GENDERS.find(g => g.id === 'gender_not_stated')!, age: AGE_GROUPS.find(a => a.id === 'age_30_39')! },
  { key: 'not-stated_40_49', gender: GENDERS.find(g => g.id === 'gender_not_stated')!, age: AGE_GROUPS.find(a => a.id === 'age_40_49')! },
  { key: 'not-stated_50_59', gender: GENDERS.find(g => g.id === 'gender_not_stated')!, age: AGE_GROUPS.find(a => a.id === 'age_50_59')! },
  { key: 'not-stated_60_69', gender: GENDERS.find(g => g.id === 'gender_not_stated')!, age: AGE_GROUPS.find(a => a.id === 'age_60_69')! },
  { key: 'not-stated_70_79', gender: GENDERS.find(g => g.id === 'gender_not_stated')!, age: AGE_GROUPS.find(a => a.id === 'age_70_79')! },
  { key: 'not-stated_80_89', gender: GENDERS.find(g => g.id === 'gender_not_stated')!, age: AGE_GROUPS.find(a => a.id === 'age_80_89')! },
  { key: 'not-stated_90_99', gender: GENDERS.find(g => g.id === 'gender_not_stated')!, age: AGE_GROUPS.find(a => a.id === 'age_90_99')! },
  */
] as const;

export type Cohort = typeof COHORTS[number];
export type CohortKey = typeof COHORTS[number]['key'];

// Benchmark performance levels
export type BenchmarkLevel = {
  poor: number;
  elite: number;
  unit: Unit; // Reference to the UNITS array
};

// Type for event benchmarks using cohort keys
export type EventBenchmarks = {
  [K in CohortKey]: BenchmarkLevel;
};

// Benchmark data for each event and cohort
export const BENCHMARKS = {
  // 1RM Deadlift benchmarks (in pounds)
  [EVENTS.find(e => e.value === 'deadlift')!.value]: {
    // Male benchmarks
    [COHORTS.find(c => c.key === 'male_18_29')!.key]: { poor: 173, elite: 552, unit: UNITS.find(u => u.value === 'pounds')! },
    [COHORTS.find(c => c.key === 'male_30_39')!.key]: { poor: 173, elite: 552, unit: UNITS.find(u => u.value === 'pounds')! },
    [COHORTS.find(c => c.key === 'male_40_49')!.key]: { poor: 164, elite: 524, unit: UNITS.find(u => u.value === 'pounds')! },
    [COHORTS.find(c => c.key === 'male_50_59')!.key]: { poor: 142, elite: 455, unit: UNITS.find(u => u.value === 'pounds')! },
    [COHORTS.find(c => c.key === 'male_60_69')!.key]: { poor: 130, elite: 415, unit: UNITS.find(u => u.value === 'pounds')! },
    [COHORTS.find(c => c.key === 'male_70_79')!.key]: { poor: 105, elite: 336, unit: UNITS.find(u => u.value === 'pounds')! },
    [COHORTS.find(c => c.key === 'male_80_89')!.key]: { poor: 105, elite: 336, unit: UNITS.find(u => u.value === 'pounds')! },
    [COHORTS.find(c => c.key === 'male_90_99')!.key]: { poor: 105, elite: 336, unit: UNITS.find(u => u.value === 'pounds')! },
    // Female benchmarks
    [COHORTS.find(c => c.key === 'female_18_29')!.key]: { poor: 84, elite: 345, unit: UNITS.find(u => u.value === 'pounds')! },
    [COHORTS.find(c => c.key === 'female_30_39')!.key]: { poor: 84, elite: 345, unit: UNITS.find(u => u.value === 'pounds')! },
    [COHORTS.find(c => c.key === 'female_40_49')!.key]: { poor: 80, elite: 328, unit: UNITS.find(u => u.value === 'pounds')! },
    [COHORTS.find(c => c.key === 'female_50_59')!.key]: { poor: 69, elite: 284, unit: UNITS.find(u => u.value === 'pounds')! },
    [COHORTS.find(c => c.key === 'female_60_69')!.key]: { poor: 63, elite: 260, unit: UNITS.find(u => u.value === 'pounds')! },
    [COHORTS.find(c => c.key === 'female_70_79')!.key]: { poor: 51, elite: 210, unit: UNITS.find(u => u.value === 'pounds')! },
    [COHORTS.find(c => c.key === 'female_80_89')!.key]: { poor: 51, elite: 210, unit: UNITS.find(u => u.value === 'pounds')! },
    [COHORTS.find(c => c.key === 'female_90_99')!.key]: { poor: 51, elite: 210, unit: UNITS.find(u => u.value === 'pounds')! },
    // Under 18 - using 18-29 values as baseline
    [COHORTS.find(c => c.key === 'male_under_18')!.key]: { poor: 173, elite: 552, unit: UNITS.find(u => u.value === 'pounds')! },
    [COHORTS.find(c => c.key === 'female_under_18')!.key]: { poor: 84, elite: 345, unit: UNITS.find(u => u.value === 'pounds')! },
  } as EventBenchmarks,
  
  // 1RM Back Squat benchmarks (in pounds)
  [EVENTS.find(e => e.value === 'back-squat')!.value]: {
    // Male benchmarks
    [COHORTS.find(c => c.key === 'male_18_29')!.key]: { poor: 141, elite: 483, unit: UNITS.find(u => u.value === 'pounds')! },
    [COHORTS.find(c => c.key === 'male_30_39')!.key]: { poor: 141, elite: 483, unit: UNITS.find(u => u.value === 'pounds')! },
    [COHORTS.find(c => c.key === 'male_40_49')!.key]: { poor: 134, elite: 458, unit: UNITS.find(u => u.value === 'pounds')! },
    [COHORTS.find(c => c.key === 'male_50_59')!.key]: { poor: 116, elite: 398, unit: UNITS.find(u => u.value === 'pounds')! },
    [COHORTS.find(c => c.key === 'male_60_69')!.key]: { poor: 96, elite: 328, unit: UNITS.find(u => u.value === 'pounds')! },
    [COHORTS.find(c => c.key === 'male_70_79')!.key]: { poor: 86, elite: 294, unit: UNITS.find(u => u.value === 'pounds')! },
    [COHORTS.find(c => c.key === 'male_80_89')!.key]: { poor: 86, elite: 294, unit: UNITS.find(u => u.value === 'pounds')! },
    [COHORTS.find(c => c.key === 'male_90_99')!.key]: { poor: 86, elite: 294, unit: UNITS.find(u => u.value === 'pounds')! },
    // Female benchmarks
    [COHORTS.find(c => c.key === 'female_18_29')!.key]: { poor: 65, elite: 300, unit: UNITS.find(u => u.value === 'pounds')! },
    [COHORTS.find(c => c.key === 'female_30_39')!.key]: { poor: 65, elite: 300, unit: UNITS.find(u => u.value === 'pounds')! },
    [COHORTS.find(c => c.key === 'female_40_49')!.key]: { poor: 60, elite: 270, unit: UNITS.find(u => u.value === 'pounds')! },
    [COHORTS.find(c => c.key === 'female_50_59')!.key]: { poor: 50, elite: 230, unit: UNITS.find(u => u.value === 'pounds')! },
    [COHORTS.find(c => c.key === 'female_60_69')!.key]: { poor: 45, elite: 180, unit: UNITS.find(u => u.value === 'pounds')! },
    [COHORTS.find(c => c.key === 'female_70_79')!.key]: { poor: 35, elite: 140, unit: UNITS.find(u => u.value === 'pounds')! },
    [COHORTS.find(c => c.key === 'female_80_89')!.key]: { poor: 35, elite: 140, unit: UNITS.find(u => u.value === 'pounds')! },
    [COHORTS.find(c => c.key === 'female_90_99')!.key]: { poor: 35, elite: 140, unit: UNITS.find(u => u.value === 'pounds')! },
    // Under 18 - using 18-29 values as baseline
    [COHORTS.find(c => c.key === 'male_under_18')!.key]: { poor: 141, elite: 483, unit: UNITS.find(u => u.value === 'pounds')! },
    [COHORTS.find(c => c.key === 'female_under_18')!.key]: { poor: 65, elite: 300, unit: UNITS.find(u => u.value === 'pounds')! },
  } as EventBenchmarks,
  
  // 1RM Military Press benchmarks (in pounds) - overhead/shoulder press data
  [EVENTS.find(e => e.value === 'military-press')!.value]: {
    // Male benchmarks
    [COHORTS.find(c => c.key === 'male_18_29')!.key]: { poor: 66, elite: 248, unit: UNITS.find(u => u.value === 'pounds')! },
    [COHORTS.find(c => c.key === 'male_30_39')!.key]: { poor: 66, elite: 248, unit: UNITS.find(u => u.value === 'pounds')! },
    [COHORTS.find(c => c.key === 'male_40_49')!.key]: { poor: 62, elite: 235, unit: UNITS.find(u => u.value === 'pounds')! },
    [COHORTS.find(c => c.key === 'male_50_59')!.key]: { poor: 58, elite: 220, unit: UNITS.find(u => u.value === 'pounds')! },
    [COHORTS.find(c => c.key === 'male_60_69')!.key]: { poor: 49, elite: 186, unit: UNITS.find(u => u.value === 'pounds')! },
    [COHORTS.find(c => c.key === 'male_70_79')!.key]: { poor: 40, elite: 151, unit: UNITS.find(u => u.value === 'pounds')! },
    [COHORTS.find(c => c.key === 'male_80_89')!.key]: { poor: 40, elite: 151, unit: UNITS.find(u => u.value === 'pounds')! },
    [COHORTS.find(c => c.key === 'male_90_99')!.key]: { poor: 40, elite: 151, unit: UNITS.find(u => u.value === 'pounds')! },
    // Female benchmarks
    [COHORTS.find(c => c.key === 'female_18_29')!.key]: { poor: 28, elite: 143, unit: UNITS.find(u => u.value === 'pounds')! },
    [COHORTS.find(c => c.key === 'female_30_39')!.key]: { poor: 28, elite: 143, unit: UNITS.find(u => u.value === 'pounds')! },
    [COHORTS.find(c => c.key === 'female_40_49')!.key]: { poor: 27, elite: 136, unit: UNITS.find(u => u.value === 'pounds')! },
    [COHORTS.find(c => c.key === 'female_50_59')!.key]: { poor: 25, elite: 127, unit: UNITS.find(u => u.value === 'pounds')! },
    [COHORTS.find(c => c.key === 'female_60_69')!.key]: { poor: 21, elite: 108, unit: UNITS.find(u => u.value === 'pounds')! },
    [COHORTS.find(c => c.key === 'female_70_79')!.key]: { poor: 17, elite: 87, unit: UNITS.find(u => u.value === 'pounds')! },
    [COHORTS.find(c => c.key === 'female_80_89')!.key]: { poor: 17, elite: 87, unit: UNITS.find(u => u.value === 'pounds')! },
    [COHORTS.find(c => c.key === 'female_90_99')!.key]: { poor: 17, elite: 87, unit: UNITS.find(u => u.value === 'pounds')! },
    // Under 18 - using 18-29 values as baseline
    [COHORTS.find(c => c.key === 'male_under_18')!.key]: { poor: 66, elite: 248, unit: UNITS.find(u => u.value === 'pounds')! },
    [COHORTS.find(c => c.key === 'female_under_18')!.key]: { poor: 28, elite: 143, unit: UNITS.find(u => u.value === 'pounds')! },
  } as EventBenchmarks,
} as const; 