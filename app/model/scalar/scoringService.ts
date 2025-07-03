import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { COHORTS, AGE_GROUPS, Cohort, CohortKey, BENCHMARKS, EVENTS, DOMAINS, Submission } from '../types';
import { DataService } from '../data/access/service';

/**
 * GENERIC DOMAIN SCORING ALGORITHM
 * 
 * This module implements normalized scoring for all fitness domains using benchmarks
 * and handles both "higher is better" and "lower is better" event types:
 * 
 * 1. COHORT MATCHING: Determines user's cohort based on age and gender
 * 2. BENCHMARK COMPARISON: Compares user's best performance in each domain event 
 *    to cohort-specific benchmarks
 * 3. SCORE CALCULATION: Uses a 0-1000 scale where:
 *    - 0-250: Below to at poor performance level
 *    - 250-750: Linear interpolation between poor and elite
 *    - 750-1000: At or above elite performance level
 * 4. DOMAIN SCORE: Averages scores across all completed events in the domain
 * 
 * EVENT TYPES:
 * - "Higher is better" (weight, repetitions, energy): More is better
 * - "Lower is better" (time): Less is better (faster times)
 * 
 * Example: A 25-year-old male who deadlifts 400 lbs:
 * - Cohort: male_18_29 (Poor: 173 lb, Elite: 552 lb)
 * - Score: 250 + 500 * ((400-173)/(552-173)) = 549/1000
 */

// Utility: Determine if an event is "higher is better" or "lower is better"
function isHigherBetter(unitType: string): boolean {
  // "Lower is better" for time events (faster times are better)
  if (unitType === 'time') {
    return false;
  }
  
  // "Higher is better" for weight, repetitions, energy events
  // (more weight lifted, more reps, more calories burned are better)
  return true;
}

// Utility: Get user's cohort based on birthday and gender
export function getUserCohort(user: { birthday?: string; gender?: { value: string } }): Cohort | undefined {
  // console.log('🔍 Debug getUserCohort: Input user:', user);
  // console.log('🔍 Debug getUserCohort: User birthday:', user.birthday);
  // console.log('🔍 Debug getUserCohort: User gender:', user.gender);
  
  if (!user.birthday || !user.gender?.value) {
    console.log('🔍 Debug getUserCohort: Missing birthday or gender, returning undefined');
    return undefined;
  }
  
  const birthYear = Number(user.birthday.split('-')[0]);
  const birthMonth = Number(user.birthday.split('-')[1] || '1');
  const birthDay = Number(user.birthday.split('-')[2] || '1');
  // console.log('🔍 Debug getUserCohort: Parsed birth date:', { birthYear, birthMonth, birthDay });
  
  const today = new Date();
  let age = today.getFullYear() - birthYear;
  // Adjust if birthday hasn't occurred yet this year
  if (
    today.getMonth() + 1 < birthMonth ||
    (today.getMonth() + 1 === birthMonth && today.getDate() < birthDay)
  ) {
    age--;
  }
  // console.log('🔍 Debug getUserCohort: Calculated age:', age);
  
  const ageGroup = AGE_GROUPS.find(g => age >= g.lowerBound && age <= g.upperBound);
  // console.log('🔍 Debug getUserCohort: Found age group:', ageGroup);
  // console.log('🔍 Debug getUserCohort: Available age groups:', AGE_GROUPS);
  
  if (!ageGroup) {
    console.log('🔍 Debug getUserCohort: No age group found, returning undefined');
    return undefined;
  }
  
  // console.log('🔍 Debug getUserCohort: Looking for cohort with gender:', user.gender?.value);
  // console.log('🔍 Debug getUserCohort: And age bounds:', ageGroup.lowerBound, '-', ageGroup.upperBound);
  // console.log('🔍 Debug getUserCohort: Available cohorts:', COHORTS);
  
  const cohort = COHORTS.find(c => c.gender.value === user.gender?.value && c.age.lowerBound === ageGroup.lowerBound && c.age.upperBound === ageGroup.upperBound);
  // console.log('🔍 Debug getUserCohort: Found cohort:', cohort);
  
  return cohort;
}

// Calculate the normalized score for a user and a domain
export async function getNormalizedDomainScore(userId: string, domainValue: string): Promise<number> {
  try {
    console.log(`🔍 [ScoreService] Starting score calculation for userId: ${userId}, domain: ${domainValue}`);
    
    // Get user submissions
    const submissions = await DataService.getSubmissionsByUserId(userId);
    console.log(`🔍 [ScoreService] Total submissions retrieved: ${submissions.length}`);
    console.log(`🔍 [ScoreService] All submissions:`, submissions.map(s => ({
      eventValue: s.event.value,
      eventDomain: s.event.domain.value,
      rawValue: s.rawValue,
      value: s.value,
      unit: s.unit?.value || 'time'
    })));
    
    // Filter submissions for this domain
    const domainSubmissions = submissions.filter(s => s.event.domain.value === domainValue);
    console.log(`🔍 [ScoreService] Domain submissions for ${domainValue}: ${domainSubmissions.length}`);
    console.log(`🔍 [ScoreService] Domain submissions details:`, domainSubmissions.map(s => ({
      eventValue: s.event.value,
      eventLabel: s.event.label,
      rawValue: s.rawValue,
      value: s.value,
      unit: s.unit?.value || 'time',
      unitType: s.event.unitType.value
    })));
    
    if (domainSubmissions.length === 0) {
      console.log(`🔍 [ScoreService] No submissions found for domain: ${domainValue}`);
      return 0; // No submissions for this domain
    }
    
    // Get user information to determine cohort
    const userSubmission = domainSubmissions[0]; // Get user from first submission
    const user = userSubmission.user;
    console.log(`🔍 [ScoreService] User from submission:`, {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      gender: user.gender,
      birthday: user.birthday
    });
    
    const cohort = getUserCohort(user);
    
    if (!cohort) {
      console.warn('Could not determine user cohort, returning 0');
      return 0;
    }
    
    // Calculate domain score using generic algorithm
    return calculateDomainScore(domainSubmissions, cohort, domainValue);
  } catch (error) {
    console.error('Error calculating normalized domain score:', error);
    return 0;
  }
}

// Calculate domain score using generic algorithm for any domain
function calculateDomainScore(submissions: Submission[], cohort: Cohort, domainValue: string): number {
  // Get all unique events in this domain from submissions
  const uniqueEvents = Array.from(new Set(submissions.map(s => s.event.value)));
  const eventScores: number[] = [];
  
  console.log(`🏃 Calculating ${domainValue} score for cohort:`, cohort.key);
  console.log(`🏃 Total domain submissions:`, submissions.length);
  console.log(`🏃 Unique events in domain:`, uniqueEvents);
  
  for (const eventValue of uniqueEvents) {
    // Get user's submissions for this event
    const eventSubmissions = submissions.filter(s => s.event.value === eventValue);
    
    if (eventSubmissions.length === 0) {
      continue; // Skip events with no submissions
    }
    
    // Get the event info to determine scoring direction
    const eventInfo = eventSubmissions[0].event;
    const higherIsBetter = isHigherBetter(eventInfo.unitType.value);
    
    // Find the best performance based on scoring direction
    console.log(`🏃 All ${eventValue} submissions:`, eventSubmissions.map(s => ({
      rawValue: s.rawValue,
      value: s.value,
      unit: s.unit?.value || 'time',
      createdAt: s.createdAt
    })));
    
    const bestSubmission = eventSubmissions.reduce((best, current) => {
      console.log(`🏃 Comparing ${eventValue} submissions - Current: ${current.value}, Best: ${best.value}`);
      if (higherIsBetter) {
        return current.value > best.value ? current : best;
      } else {
        return current.value < best.value ? current : best;
      }
    });
    
    console.log(`🏃 Best ${eventValue} performance:`, {
      rawValue: bestSubmission.rawValue,
      value: bestSubmission.value,
      unit: bestSubmission.unit?.value || 'time',
      higherIsBetter
    });
    
    // Get benchmarks for this event and cohort
    const eventBenchmarks = BENCHMARKS[eventValue as keyof typeof BENCHMARKS];
    if (!eventBenchmarks) {
      console.warn(`🏃 No benchmarks found for event: ${eventValue}`);
      continue; // Skip if no benchmarks available
    }
    
    const cohortBenchmarks = eventBenchmarks[cohort.key as keyof typeof eventBenchmarks];
    if (!cohortBenchmarks) {
      console.warn(`🏃 No cohort benchmarks found for ${eventValue} and cohort ${cohort.key}`);
      continue; // Skip if no cohort benchmarks available
    }
    
    console.log(`🏃 ${eventValue} benchmarks - Poor: ${cohortBenchmarks.poor}, Elite: ${cohortBenchmarks.elite}`);
    
    // Calculate normalized score (0-1000 scale)
    const score = calculateEventScore(bestSubmission.value, cohortBenchmarks.poor, cohortBenchmarks.elite, higherIsBetter);
    console.log(`🏃 ${eventValue} normalized score: ${score}`);
    eventScores.push(score);
  }
  
  const finalScore = eventScores.length > 0 ? Math.round(eventScores.reduce((sum, score) => sum + score, 0) / eventScores.length) : 0;
  console.log(`🏃 Final ${domainValue} domain score:`, finalScore);
  
  // Return average score if we have any event scores, otherwise 0
  return finalScore;
}

// Calculate individual event score based on performance vs benchmarks
function calculateEventScore(userPerformance: number, poorBenchmark: number, eliteBenchmark: number, higherIsBetter: boolean = true): number {
  // Clamp performance to reasonable bounds
  const performance = Math.max(0, userPerformance);
  
  if (higherIsBetter) {
    // For "higher is better" events (weight, reps, calories)
    // If user is at or below poor benchmark, give them a low score (0-250)
    if (performance <= poorBenchmark) {
      return Math.max(0, Math.round(250 * (performance / poorBenchmark)));
    }
    
    // If user is at or above elite benchmark, give them a high score (750-1000)
    if (performance >= eliteBenchmark) {
      const excessRatio = (performance - eliteBenchmark) / eliteBenchmark;
      return Math.min(1000, Math.round(750 + 250 * excessRatio));
    }
    
    // User is between poor and elite, interpolate linearly (250-750)
    const ratio = (performance - poorBenchmark) / (eliteBenchmark - poorBenchmark);
    return Math.round(250 + 500 * ratio);
  } else {
    // For "lower is better" events (time) - flip the logic
    // If user is at or above poor benchmark (slower), give them a low score (0-250)
    if (performance >= poorBenchmark) {
      return Math.max(0, Math.round(250 * (poorBenchmark / performance)));
    }
    
    // If user is at or below elite benchmark (faster), give them a high score (750-1000)
    if (performance <= eliteBenchmark) {
      const excessRatio = (eliteBenchmark - performance) / eliteBenchmark;
      return Math.min(1000, Math.round(750 + 250 * excessRatio));
    }
    
    // User is between elite and poor, interpolate linearly (250-750)
    const ratio = (poorBenchmark - performance) / (poorBenchmark - eliteBenchmark);
    return Math.round(250 + 500 * ratio);
  }
}

// Fetch normalized scores for each domain for a user
export async function getUserDomainScores(userId: string, domainValues: string[]): Promise<{ [domainValue: string]: number }> {
  const scores: { [domainValue: string]: number } = {};
  for (const domainValue of domainValues) {
    scores[domainValue] = await getNormalizedDomainScore(userId, domainValue);
  }
  return scores;
}

// Helper function to get any domain score for a specific user (for testing/debugging)
export async function getUserDomainScore(userId: string, domainValue: string): Promise<number> {
  return await getNormalizedDomainScore(userId, domainValue);
}

// Helper function to calculate event score (exported for testing)
export function calculateNormalizedEventScore(userPerformance: number, poorBenchmark: number, eliteBenchmark: number, higherIsBetter: boolean = true): number {
  return calculateEventScore(userPerformance, poorBenchmark, eliteBenchmark, higherIsBetter);
} 