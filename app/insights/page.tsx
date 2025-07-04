'use client';
import { useUser } from '../model/auth/UserContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
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
import { getUserDomainScores, getUserCohort } from '../model/scalar/scoringService';
import { DOMAINS } from '../model/types';
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

export default function ScalarPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [domainsLoading, setDomainsLoading] = useState(true);
  const [domainScores, setDomainScores] = useState<{ [domainValue: string]: number }>({});
  const [scoresLoading, setScoresLoading] = useState(true);
  const [userCohort, setUserCohort] = useState<Cohort | undefined>(undefined);
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

        {/* Debug Info Section */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
          <h3 className="text-sm font-semibold text-yellow-800 mb-2">🔍 Debug Information</h3>
          <div className="space-y-2 text-xs text-yellow-700">
            <div>
              <strong>User:</strong> {user.firstName} {user.lastName} ({user.email})
            </div>
            <div>
              <strong>Cohort:</strong> {userCohort ? `${userCohort.gender.label}, ${userCohort.age.lowerBound}-${userCohort.age.upperBound} years (${userCohort.key})` : 'Not calculated'}
            </div>
            <div>
              <strong>Domain Scores:</strong>
              <div className="ml-4 mt-1">
                {domains.map(domain => (
                  <div key={domain.value} className="flex justify-between">
                    <span>{domain.label}:</span>
                    <span className="font-mono">{Math.round((domainScores[domain.value] ?? 0) * 10) / 10}/100</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <strong>Max Score:</strong> {maxScore}
            </div>
            <div className="text-xs text-yellow-600 mt-2">
              Check browser console for detailed score calculation logs.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 