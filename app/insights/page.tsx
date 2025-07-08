'use client';
import { useUser } from '../model/auth/UserContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import React from 'react';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { DataService } from '../model/data/access/service';
import type { Domain, Cohort } from '../model/types';
import { getUserDomainScores, getUserCohort, calculateNormalizedEventScore } from '../model/scalar/scoringService';
import { DOMAINS, BENCHMARKS } from '../model/types';
import type { Submission } from '../model/types';
import * as GiIcons from 'react-icons/gi';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

function useIsMobile(breakpoint = 600) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth <= breakpoint);
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);
  return isMobile;
}

// Helper function to format time in seconds to MM:SS format
function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export default function ScalarPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [domainsLoading, setDomainsLoading] = useState(true);
  const [domainScores, setDomainScores] = useState<{ [domainValue: string]: number }>({});
  const [scoresLoading, setScoresLoading] = useState(true);
  const [userCohort, setUserCohort] = useState<Cohort | undefined>(undefined);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const isMobile = useIsMobile();

  // Fetch domains from Firebase
  useEffect(() => {
    async function fetchDomains() {
      setDomainsLoading(true);
      try {
        const fetchedDomains = await DataService.getAllDomains();
        setDomains(fetchedDomains);
      } catch (error) {
        setDomains([]);
      }
      setDomainsLoading(false);
    }
    fetchDomains();
  }, []);

  // Fetch domain scores for the user
  useEffect(() => {
    if (user && user.id && domains.length > 0) {
      setScoresLoading(true);
      const domainValues = domains.map(d => d.value);
      
      console.log('🔍 [Insights] Starting score calculation for user:', user.id);
      console.log('🔍 [Insights] User data:', {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        gender: user.gender,
        birthday: user.birthday
      });
      console.log('🔍 [Insights] Domain values to calculate:', domainValues);
      console.log('🔍 [Insights] Available domains:', domains.map(d => ({ value: d.value, label: d.label })));
      
      getUserDomainScores(user.id, domainValues).then(scores => {
        console.log('🔍 [Insights] Received domain scores:', scores);
        
        // Log each domain score individually
        Object.entries(scores).forEach(([domainValue, score]) => {
          const domain = domains.find(d => d.value === domainValue);
          console.log(`🔍 [Insights] ${domain?.label || domainValue}: ${score}/1000`);
        });
        
        setDomainScores(scores);
        setScoresLoading(false);
      }).catch(error => {
        console.error('🔍 [Insights] Error fetching domain scores:', error);
        setScoresLoading(false);
      });
    }
  }, [user, domains]);

  // Get user's cohort
  useEffect(() => {
    if (user) {
      console.log('🔍 [Insights] Calculating user cohort for user:', user.id);
      console.log('🔍 [Insights] User birthday:', user.birthday);
      console.log('🔍 [Insights] User gender:', user.gender);
      
      const cohort = getUserCohort(user);
      console.log('🔍 [Insights] Calculated cohort:', cohort);
      
      if (cohort) {
        console.log('🔍 [Insights] Cohort details:', {
          key: cohort.key,
          gender: cohort.gender.label,
          ageRange: `${cohort.age.lowerBound}-${cohort.age.upperBound}`
        });
      } else {
        console.warn('🔍 [Insights] No cohort found for user - this will result in zero scores');
      }
      
      setUserCohort(cohort);
    }
  }, [user]);

  // Get performance data for table
  useEffect(() => {
    if (user && user.id && userCohort && domains.length > 0) {
      async function fetchPerformanceData() {
        try {
          if (!user?.id || !userCohort) return;
          
          const submissions = await DataService.getSubmissionsByUserId(user.id);
          const performanceResults: any[] = [];
          
          // Group submissions by domain
          const domainSubmissions = domains.map(domain => ({
            domain,
            submissions: submissions.filter(s => s.event.domain.value === domain.value)
          }));
          
          // For each domain, find best performance for each event
          for (const { domain, submissions: domainSubs } of domainSubmissions) {
            if (domainSubs.length === 0) continue;
            
            // Get unique events in this domain
            const uniqueEvents = Array.from(new Set(domainSubs.map(s => s.event.value)));
            
            for (const eventValue of uniqueEvents) {
              const eventSubmissions = domainSubs.filter(s => s.event.value === eventValue);
              if (eventSubmissions.length === 0) continue;
              
              const eventInfo = eventSubmissions[0].event;
              const higherIsBetter = eventInfo.unitType.value === 'weight' || eventInfo.unitType.value === 'repetitions' || eventInfo.unitType.value === 'energy';
              
              // Find best performance
              const bestSubmission = eventSubmissions.reduce((best, current) => {
                if (higherIsBetter) {
                  return current.value > best.value ? current : best;
                } else {
                  return current.value < best.value ? current : best;
                }
              });
              
              // Get benchmarks for this event and cohort
              const eventBenchmarks = BENCHMARKS[eventValue as keyof typeof BENCHMARKS];
              if (eventBenchmarks && eventBenchmarks[userCohort.key as keyof typeof eventBenchmarks]) {
                const cohortBenchmarks = eventBenchmarks[userCohort.key as keyof typeof eventBenchmarks];
                const score = calculateNormalizedEventScore(
                  bestSubmission.value,
                  cohortBenchmarks.foundational,
                  cohortBenchmarks.elite,
                  higherIsBetter
                );
                
                performanceResults.push({
                  domain: domain.label,
                  domainValue: domain.value,
                  event: eventInfo.label,
                  eventValue: eventInfo.value,
                  userPerformance: bestSubmission.value,
                  userRawValue: bestSubmission.rawValue,
                  unit: bestSubmission.unit?.label || 'time',
                  unitValue: bestSubmission.unit?.value || 'seconds',
                  foundationalBenchmark: cohortBenchmarks.foundational,
                  eliteBenchmark: cohortBenchmarks.elite,
                  benchmarkUnit: cohortBenchmarks.unit.label,
                  score: Math.round(score),
                  higherIsBetter
                });
              }
            }
          }
          
          // Sort by domain, then by score (highest first)
          performanceResults.sort((a, b) => {
            if (a.domainValue !== b.domainValue) {
              return a.domain.localeCompare(b.domain);
            }
            return b.score - a.score;
          });
          
          setPerformanceData(performanceResults);
        } catch (error) {
          console.error('Error fetching performance data:', error);
          setPerformanceData([]);
        }
      }
      
      fetchPerformanceData();
    }
  }, [user, userCohort, domains]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login');
    }
  }, [user, userLoading, router]);

  if (userLoading || domainsLoading || scoresLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  if (domains.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="text-gray-500">No domains found. Please add domains in the admin panel.</div>
      </div>
    );
  }

  // Use empty strings for radarLabels so Chart.js doesn't render text
  const radarLabels = domains.map(() => '');

  // Radar chart data (use fetched scores)
  const chartData = domains.map(d => domainScores[d.value] ?? 0);
  const radarData = {
    labels: radarLabels,
    datasets: [
      {
        label: 'Scalar',
        data: chartData,
        backgroundColor: 'rgba(59, 130, 246, 0.2)', // blue-500, 20% opacity
        borderColor: 'rgba(59, 130, 246, 1)', // blue-500
        borderWidth: 2,
        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
      },
    ],
  };

  // Fixed max of 100 for the new 0-100 scoring scale
  const maxScore = 100;
  
  // Debug logging for chart data
  console.log('🔍 [Insights] Chart data being rendered:', {
    domains: domains.map(d => d.label),
    scores: chartData,
    maxScore,
    domainScores
  });

  const radarOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
    scales: {
      r: {
        min: 0,
        max: maxScore,
        ticks: {
          stepSize: 20,
          color: '#6B7280', // gray-500
        },
        pointLabels: {
          color: '#111827', // gray-900
          font: { size: 12, weight: 'bold' as const },
        },
        grid: {
          color: '#E5E7EB', // gray-200
        },
        angleLines: {
          color: '#E5E7EB', // gray-200
        },
      },
    },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-6">
        {/* Header */}
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Insights</h1>

        {/* Cohort Information */}
        {userCohort && (
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Your Cohort</h3>
                <p className="text-lg font-semibold text-gray-900">
                  {userCohort.gender.label}, {userCohort.age.lowerBound}-{userCohort.age.upperBound} years
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Compared to peers</p>
                <p className="text-xs text-gray-400">in your age group</p>
              </div>
            </div>
          </div>
        )}

        {/* Radar Chart */}
        <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
          <div className="w-full flex justify-center mb-4">
            <div className="relative w-72 h-72">
              <Radar data={radarData} options={radarOptions} />
              {domains.map((d, i) => {
                const angle = (i / domains.length) * 2 * Math.PI - Math.PI / 2;
                const radius = 145; // push icons even further out from center
                const center = 144; // 72*2=144, center of w-72
                const x = Math.cos(angle) * radius + center;
                const y = Math.sin(angle) * radius + center;
                const Icon = GiIcons[d.logo as keyof typeof GiIcons];
                return (
                  <span
                    key={d.value}
                    style={{
                      position: 'absolute',
                      left: x,
                      top: y,
                      transform: 'translate(-50%, -50%)',
                      pointerEvents: 'none',
                    }}
                  >
                    {Icon && <Icon className="w-7 h-7 text-blue-500" />}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Performance Table */}
        <div className="bg-white rounded-lg shadow-sm p-4 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Best Performances</h3>
          
          {performanceData.length > 0 ? (
            <div className="space-y-4">
              {/* Group by domain */}
              {domains.map(domain => {
                const domainPerformances = performanceData.filter(p => p.domainValue === domain.value);
                if (domainPerformances.length === 0) return null;
                
                return (
                  <div key={domain.value} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <div className="flex items-center space-x-2">
                        {GiIcons[domain.logo as keyof typeof GiIcons] && (
                          <span className="text-blue-500">
                            {React.createElement(GiIcons[domain.logo as keyof typeof GiIcons], { className: "w-5 h-5" })}
                          </span>
                        )}
                        <h4 className="font-medium text-gray-900">{domain.label}</h4>
                        <span className="text-sm text-gray-500">
                          ({domainScores[domain.value] ?? 0}/100)
                        </span>
                      </div>
                    </div>
                    
                    <div className="divide-y divide-gray-200">
                      {domainPerformances.map((performance, index) => (
                        <div key={`${performance.eventValue}-${index}`} className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-900">{performance.event}</h5>
                              <div className="mt-1 space-y-1">
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm text-gray-500">Your best:</span>
                                  <span className="font-semibold text-gray-900">
                                    {performance.unitValue === 'seconds' ? 
                                      formatTime(performance.userPerformance) : 
                                      `${performance.userRawValue} ${performance.unit}`
                                    }
                                  </span>
                                </div>
                                <div className="flex items-center space-x-4 text-xs text-gray-500">
                                  <span>
                                    Foundational: {performance.unitValue === 'seconds' ? 
                                      formatTime(performance.foundationalBenchmark) : 
                                      `${performance.foundationalBenchmark} ${performance.benchmarkUnit}`
                                    }
                                  </span>
                                  <span>
                                    Elite: {performance.unitValue === 'seconds' ? 
                                      formatTime(performance.eliteBenchmark) : 
                                      `${performance.eliteBenchmark} ${performance.benchmarkUnit}`
                                    }
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex flex-col items-end">
                              <div className="text-right">
                                <span className={`text-lg font-bold ${
                                  performance.score >= 80 ? 'text-green-600' :
                                  performance.score >= 60 ? 'text-yellow-600' :
                                  performance.score >= 40 ? 'text-orange-600' :
                                  'text-red-600'
                                }`}>
                                  {performance.score}
                                </span>
                                <span className="text-sm text-gray-500">/100</span>
                              </div>
                              <div className="mt-1 w-20 bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    performance.score >= 80 ? 'bg-green-500' :
                                    performance.score >= 60 ? 'bg-yellow-500' :
                                    performance.score >= 40 ? 'bg-orange-500' :
                                    'bg-red-500'
                                  }`}
                                  style={{ width: `${Math.min(performance.score, 100)}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No performance data available yet.</p>
              <p className="text-sm">Submit some performances to see your results here!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 