import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { COHORTS, AGE_GROUPS, Cohort, CohortKey } from '../types';

// Utility: Get user's cohort based on birthday and gender
export function getUserCohort(user: { birthday?: string; gender?: { value: string } }): Cohort | undefined {
  if (!user.birthday || !user.gender?.value) return undefined;
  const birthYear = Number(user.birthday.split('-')[0]);
  const birthMonth = Number(user.birthday.split('-')[1] || '1');
  const birthDay = Number(user.birthday.split('-')[2] || '1');
  const today = new Date();
  let age = today.getFullYear() - birthYear;
  // Adjust if birthday hasn't occurred yet this year
  if (
    today.getMonth() + 1 < birthMonth ||
    (today.getMonth() + 1 === birthMonth && today.getDate() < birthDay)
  ) {
    age--;
  }
  const ageGroup = AGE_GROUPS.find(g => age >= g.lowerBound && age <= g.upperBound);
  if (!ageGroup) return undefined;
  return COHORTS.find(c => c.gender === user.gender?.value && c.age.lowerBound === ageGroup.lowerBound && c.age.upperBound === ageGroup.upperBound);
}

// Calculate the normalized score for a user and a domain
export async function getNormalizedDomainScore(userId: string, domainValue: string): Promise<number> {
  // TODO: Implement normalization algorithm
  return Math.floor(Math.random() * 1001); // random value between 0 and 1000
}

// Fetch normalized scores for each domain for a user
export async function getUserDomainScores(userId: string, domainValues: string[]): Promise<{ [domainValue: string]: number }> {
  const scores: { [domainValue: string]: number } = {};
  for (const domainValue of domainValues) {
    scores[domainValue] = await getNormalizedDomainScore(userId, domainValue);
  }
  return scores;
} 