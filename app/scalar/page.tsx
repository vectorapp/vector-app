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
import type { Domain } from '../model/types';
import { getUserDomainScores } from '../model/scalar/scoringService';
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
      getUserDomainScores(user.id, domainValues).then(scores => {
        setDomainScores(scores);
        setScoresLoading(false);
      });
    }
  }, [user, domains]);

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

  // Use logo icons as labels (Chart.js only supports strings, so use emoji as placeholder)
  const radarLabels = domains.map(d => {
    // Option 1: Use emoji as placeholder for icon
    // return '🔵';
    // Option 2: Use the icon name as a string (will render as text)
    return d.logo;
    // Option 3: If Chart.js ever supports React nodes, use:
    // const Icon = GiIcons[d.logo as keyof typeof GiIcons];
    // return <Icon />;
  });

  // Radar chart data (use fetched scores)
  const radarData = {
    labels: radarLabels,
    datasets: [
      {
        label: 'Scalar',
        data: domains.map(d => domainScores[d.value] ?? 0),
        backgroundColor: 'rgba(59, 130, 246, 0.2)', // blue-500, 20% opacity
        borderColor: 'rgba(59, 130, 246, 1)', // blue-500
        borderWidth: 2,
        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
      },
    ],
  };

  // Dynamically set max to the largest normalized value (or 1 if all are zero)
  const maxScore = Math.max(1, ...Object.values(domainScores));

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
          stepSize: 250,
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="bg-white rounded-lg shadow p-8 flex flex-col items-center w-full max-w-md">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Scalar</h1>
        <div className="text-5xl font-extrabold text-blue-600 mb-2">0</div>
        <div className="w-full flex justify-center mb-4">
          <div className="w-72 h-72">
            <Radar data={radarData} options={radarOptions} />
          </div>
        </div>
      </div>
    </div>
  );
} 