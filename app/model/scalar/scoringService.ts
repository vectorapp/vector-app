import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { COHORTS, AGE_GROUPS, Cohort, CohortKey, BENCHMARKS, EVENTS, DOMAINS, Submission } from '../types';
import { DataService } from '../data/access/service';

/**
 * STRENGTH DOMAIN SCORING ALGORITHM
 * 
 * This module implements normalized scoring for the muscular strength domain using benchmarks
 * from Marathon Handbook strength training data. The scoring system:
 * 
 * 1. COHORT MATCHING: Determines user's cohort based on age and gender
 * 2. BENCHMARK COMPARISON: Compares user's best performance in each strength event 
 *    (deadlift, back squat, military press) to cohort-specific benchmarks
 * 3. SCORE CALCULATION: Uses a 0-1000 scale where:
 *    - 0-250: Below to at poor performance level
 *    - 250-750: Linear interpolation between poor and elite
 *    - 750-1000: At or above elite performance level
 * 4. DOMAIN SCORE: Averages scores across all completed strength events
 * 
 * Example: A 25-year-old male who deadlifts 400 lbs:
 * - Cohort: male_18_29 (Poor: 173 lb, Elite: 552 lb)
 * - Score: 250 + 500 * ((400-173)/(552-173)) = 549/1000
 */

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
    // Get user submissions
    const submissions = await DataService.getSubmissionsByUserId(userId);
    
    // Filter submissions for this domain
    const domainSubmissions = submissions.filter(s => s.event.domain.value === domainValue);
    
    if (domainSubmissions.length === 0) {
      return 0; // No submissions for this domain
    }
    
    // Get user information to determine cohort
    const userSubmission = domainSubmissions[0]; // Get user from first submission
    const user = userSubmission.user;
    const cohort = getUserCohort(user);
    
    if (!cohort) {
      console.warn('Could not determine user cohort, returning 0');
      return 0;
    }
    
    // Handle strength domain specifically
    if (domainValue === 'muscular-strength') {
      return calculateStrengthScore(domainSubmissions, cohort);
    }
    
    // For other domains, return a placeholder score for now
    return Math.floor(Math.random() * 1001);
  } catch (error) {
    console.error('Error calculating normalized domain score:', error);
    return 0;
  }
}

// Calculate strength domain score using benchmarks
function calculateStrengthScore(submissions: Submission[], cohort: Cohort): number {
  const strengthEvents = ['deadlift', 'back-squat', 'military-press'];
  const eventScores: number[] = [];
  
  console.log('🏋️ Calculating strength score for cohort:', cohort.key);
  console.log('🏋️ Total strength submissions:', submissions.length);
  
  for (const eventValue of strengthEvents) {
    // Get user's best performance for this event
    const eventSubmissions = submissions.filter(s => s.event.value === eventValue);
    
    if (eventSubmissions.length === 0) {
      continue; // Skip events with no submissions
    }
    
    // Find the best (highest) performance
    const bestSubmission = eventSubmissions.reduce((best, current) => 
      current.value > best.value ? current : best
    );
    
    console.log(`🏋️ Best ${eventValue} performance:`, bestSubmission.value);
    
    // Get benchmarks for this event and cohort
    const eventBenchmarks = BENCHMARKS[eventValue as keyof typeof BENCHMARKS];
    if (!eventBenchmarks) {
      console.warn(`🏋️ No benchmarks found for event: ${eventValue}`);
      continue; // Skip if no benchmarks available
    }
    
    const cohortBenchmarks = eventBenchmarks[cohort.key as keyof typeof eventBenchmarks];
    if (!cohortBenchmarks) {
      console.warn(`🏋️ No cohort benchmarks found for ${eventValue} and cohort ${cohort.key}`);
      continue; // Skip if no cohort benchmarks available
    }
    
    console.log(`🏋️ ${eventValue} benchmarks - Poor: ${cohortBenchmarks.poor}, Elite: ${cohortBenchmarks.elite}`);
    
    // Calculate normalized score (0-1000 scale)
    const score = calculateEventScore(bestSubmission.value, cohortBenchmarks.poor, cohortBenchmarks.elite);
    console.log(`🏋️ ${eventValue} normalized score: ${score}`);
    eventScores.push(score);
  }
  
  const finalScore = eventScores.length > 0 ? Math.round(eventScores.reduce((sum, score) => sum + score, 0) / eventScores.length) : 0;
  console.log('🏋️ Final strength domain score:', finalScore);
  
  // Return average score if we have any event scores, otherwise 0
  return finalScore;
}

// Calculate individual event score based on performance vs benchmarks
function calculateEventScore(userPerformance: number, poorBenchmark: number, eliteBenchmark: number): number {
  // Clamp performance to reasonable bounds
  const performance = Math.max(0, userPerformance);
  
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
}

// Fetch normalized scores for each domain for a user
export async function getUserDomainScores(userId: string, domainValues: string[]): Promise<{ [domainValue: string]: number }> {
  const scores: { [domainValue: string]: number } = {};
  for (const domainValue of domainValues) {
    scores[domainValue] = await getNormalizedDomainScore(userId, domainValue);
  }
  return scores;
}

// Helper function to get strength score for a specific user (for testing/debugging)
export async function getUserStrengthScore(userId: string): Promise<number> {
  return await getNormalizedDomainScore(userId, 'muscular-strength');
}

// Helper function to calculate event score (exported for testing)
export function calculateNormalizedEventScore(userPerformance: number, poorBenchmark: number, eliteBenchmark: number): number {
  return calculateEventScore(userPerformance, poorBenchmark, eliteBenchmark);
} 