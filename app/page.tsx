"use client";
import { useEffect, useState } from 'react';
import { db } from './firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { computeCoreScore } from './lib/normalization';
import { Submission, PopulationStats } from './lib/normalization/types';
import { useFirestoreCollection } from './lib/useFirestoreCollection';

export default function Home() {
  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  const [coreScore, setCoreScore] = useState<number>(0);
  const [domainScores, setDomainScores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { items: events, loading: eventsLoading } = useFirestoreCollection('events', 'label');
  const { items: units, loading: unitsLoading } = useFirestoreCollection('units', 'label');

  // Helper to get the first unit label for an event's unitType
  function getUnitLabel(unitType: string | undefined) {
    const unitObj = units.find(u => u.value === unitType);
    return unitObj && unitObj.units && unitObj.units.length > 0 ? unitObj.units[0].label : '';
  }

  useEffect(() => {
    async function fetchData() {
      if (eventsLoading) return;
      // 1. Fetch user submissions
      const userId = "nlayton"; // or your hardcoded user
      const q = query(collection(db, 'submissions'), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      const submissions: Submission[] = [];
      querySnapshot.forEach(doc => {
        const data = doc.data();
        submissions.push({
          event: data.event,
          value: Number(data.normalizedValue ?? data.value),
          userId: data.userId,
          domain: data.domain ?? (events.find(e => e.value === data.event)?.domain ?? ''),
          timestamp: data.timestamp ?? null,
        });
      });

      // 2. Hardcode population stats for demo
      const populationStats: PopulationStats[] = events.map(event => ({
        event: event.value,
        gender: 'male',
        ageGroup: '30-39',
        mean: 100,
        stddev: 15,
      }));

      // 3. Compute core score
      try {
        const result = computeCoreScore(submissions, populationStats);
        setCoreScore(result.value);
        setDomainScores(result.domains);
      } catch (e) {
        setCoreScore(0);
        setDomainScores([]);
      }
      setLoading(false);
    }
    fetchData();
  }, [events, eventsLoading]);

  function formatDate(ts: any) {
    if (!ts) return '';
    // Firestore Timestamp object
    if (typeof ts.toDate === 'function') {
      return ts.toDate().toLocaleDateString();
    }
    // ISO string or Date
    try {
      return new Date(ts).toLocaleDateString();
    } catch {
      return '';
    }
  }

  // After computing domainScores, flatten all events into a single array
  const allEvents = domainScores.flatMap(domain => domain.events);
  // Create a map to keep only the top (highest normalized) submission per event
  const topEventsMap = new Map<string, any>();
  allEvents.forEach(event => {
    if (
      !topEventsMap.has(event.event) ||
      event.normalized > topEventsMap.get(event.event).normalized
    ) {
      topEventsMap.set(event.event, event);
    }
  });
  const topEvents = Array.from(topEventsMap.values());

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded shadow text-black">
      <h1 className="text-3xl font-bold mb-8 text-center">Your Scalar Dashboard</h1>
      <div className="flex flex-col items-center mb-10">
        <span className="text-lg font-semibold mb-2">Scalar Score</span>
        <span className="text-7xl font-extrabold text-blue-600">
          {loading ? '...' : coreScore}
        </span>
      </div>
      <div>
        <h2 className="text-xl font-bold mb-4">Top Event Submissions</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 rounded">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 border-b text-left">Event</th>
                <th className="px-4 py-2 border-b text-left">Score</th>
                <th className="px-4 py-2 border-b text-left">Unit</th>
                <th className="px-4 py-2 border-b text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading || eventsLoading || unitsLoading ? (
                <tr><td colSpan={3}>Loading...</td></tr>
              ) : (
                topEvents.map((event: any) => (
                  <tr key={event.event}>
                    <td className="px-4 py-2 border-b">{events.find(e => e.value === event.event)?.label ?? event.event}</td>
                    <td className="px-4 py-2 border-b">{event.normalized}</td>
                    <td className="px-4 py-2 border-b">{getUnitLabel(events.find(e => e.value === event.event)?.unitType)}</td>
                    <td className="px-4 py-2 border-b">{formatDate(event.timestamp)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
