import { Submission, PopulationStats, NormalizedScore } from './types';

export function zScore(
  value: number,
  mean: number,
  stddev: number
): number {
  if (stddev === 0) return 0;
  return (value - mean) / stddev;
}

// Convert z-score to a normalized 0-100 scale, with 50 as average
export function normalizedScore(z: number): number {
  return Math.round(50 + z * 10); // 1 stddev = 10 points
}

export function normalizeSubmission(
  submission: Submission,
  populationStats: PopulationStats
): NormalizedScore {
  const z = zScore(submission.value, populationStats.mean, populationStats.stddev);
  return {
    event: submission.event,
    zScore: z,
    normalized: normalizedScore(z),
    domain: submission.domain,
  };
} 