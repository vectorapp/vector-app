export type Submission = {
  event: string;
  value: number;
  userId: string;
  gender: string;
  age: number;
  domain: string;
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