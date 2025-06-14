import { Submission, PopulationStats, DomainScore, CoreScore } from './types';
import { normalizeSubmission } from './zscore';

export function computeCoreScore(
  submissions: Submission[],
  populationStats: PopulationStats[]
): CoreScore {
  // Normalize all submissions
  const normalized = submissions.map(sub => {
    const stats = populationStats.find(
      s => s.event === sub.event      );
    if (!stats) throw new Error(`No stats for event ${sub.event}`);
    return normalizeSubmission(sub, stats);
  });

  // Group by domain
  const domains = Array.from(new Set(normalized.map(n => n.domain)));
  const domainScores: DomainScore[] = domains.map(domain => {
    const events = normalized.filter(n => n.domain === domain);
    const average = events.length
      ? events.reduce((sum, e) => sum + e.normalized, 0) / events.length
      : 0;
    return { domain, average, events };
  });

  // CoreScore: average of domain averages
  const coreValue = domainScores.length
    ? Math.round(domainScores.reduce((sum, d) => sum + d.average, 0) / domainScores.length)
    : 0;

  return { value: coreValue, domains: domainScores };
}