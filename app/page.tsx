"use client";
import { useEffect, useState } from 'react';
import { useFirestoreCollection } from './lib/useFirestoreCollection';
import { db } from './firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [latestSubmissions, setLatestSubmissions] = useState<any[]>([]);

  const { items: events, loading: eventsLoading } = useFirestoreCollection('events', 'label');
  const { items: units, loading: unitsLoading } = useFirestoreCollection('units', 'label');
  const { items: domains, loading: domainsLoading } = useFirestoreCollection('domains', 'label');
  console.log('Events:', events);
  console.log('Units:', units);
  console.log('Domains:', domains);

  function getUnitLabel(unitType: string | undefined) {
    const unitObj = units.find((u: any) => u.value === unitType);
    return unitObj && unitObj.units && unitObj.units.length > 0 ? unitObj.units[0].label : '';
  }

  function getEventLabel(eventId: string) {
    const event = events.find((e: any) => e.value === eventId);
    return event ? event.label : eventId;
  }

  function getDomainLabel(domainId: string) {
    const domain = domains.find((d: any) => d.value === domainId);
    return domain ? domain.label : domainId;
  }

  useEffect(() => {
    async function fetchData() {
      if (eventsLoading || domainsLoading) return;
      const userId = "o5NeITfIMwSQhhyV28HQ";
      
      // Query submissions ordered by timestamp (latest first) and limit to 20
      const q = query(
        collection(db, 'submissions'), 
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(20)
      );
      
      const querySnapshot = await getDocs(q);
      const submissions: any[] = [];
      
      querySnapshot.forEach(doc => {
        const data = doc.data();
        console.log('Submission data:', data);
        submissions.push({
          id: doc.id,
          event: data.event,
          value: Number(data.value),
          rawValue: data.rawValue,
          userId: data.userId,
          unit: data.unit,
          timestamp: data.timestamp ?? null,
          createdAt: data.createdAt ?? null,
        });
      });

      // Sort by creation date (latest first) and format for display
      const formattedSubmissions = submissions
        .sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || a.timestamp?.toDate?.() || new Date(a.createdAt || a.timestamp);
          const dateB = b.createdAt?.toDate?.() || b.timestamp?.toDate?.() || new Date(b.createdAt || b.timestamp);
          return dateB.getTime() - dateA.getTime();
        })
        .map(sub => ({
          id: sub.id,
          domain: getDomainLabel(sub.event?.domain || ''),
          event: getEventLabel(sub.event?.value || sub.event),
          value: sub.value,
          unit: sub.unit || getUnitLabel(sub.event?.unitType),
          timestamp: sub.timestamp,
          createdAt: sub.createdAt,
        }));

      console.log('Latest submissions:', formattedSubmissions);
      setLatestSubmissions(formattedSubmissions);
      setLoading(false);
    }
    fetchData();
  }, [events, eventsLoading, domains, domainsLoading]);

  function formatDate(ts: any) {
    if (!ts) return '';
    if (typeof ts.toDate === 'function') {
      return ts.toDate().toLocaleDateString();
    }
    try {
      return new Date(ts).toLocaleDateString();
    } catch {
      return '';
    }
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded shadow text-black">
      <h1 className="text-3xl font-bold mb-8 text-center">Your Scalar Dashboard</h1>
      <div>
        <h2 className="text-xl font-bold mb-4">Latest Submissions</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 rounded">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 border-b text-left">Domain</th>
                <th className="px-4 py-2 border-b text-left">Event</th>
                <th className="px-4 py-2 border-b text-left">Value</th>
                <th className="px-4 py-2 border-b text-left">Unit</th>
                <th className="px-4 py-2 border-b text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading || eventsLoading || unitsLoading || domainsLoading ? (
                <tr><td colSpan={5}>Loading...</td></tr>
              ) : latestSubmissions.length === 0 ? (
                <tr><td colSpan={5}>No submissions found.</td></tr>
              ) : (
                latestSubmissions.map((row, i) => {
                  // Log the row and value for debugging
                  console.log('Rendering row:', row);
                  if (typeof row.value !== 'number' || isNaN(row.value)) {
                    console.warn('Invalid row.value detected:', row.value, 'in row:', row);
                  }
                  return (
                    <tr key={row.id || i}>
                      <td className="px-4 py-2 border-b">{row.domain}</td>
                      <td className="px-4 py-2 border-b">{row.event}</td>
                      <td className="px-4 py-2 border-b">{typeof row.value === 'number' && !isNaN(row.value) ? row.value : '-'}</td>
                      <td className="px-4 py-2 border-b">{row.unit}</td>
                      <td className="px-4 py-2 border-b">{formatDate(row.createdAt || row.timestamp)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
