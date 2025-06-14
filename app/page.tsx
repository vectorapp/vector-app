"use client";
import { useEffect, useState } from 'react';
import { db } from './firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useFirestoreCollection } from './lib/useFirestoreCollection';
import { Submission } from './lib/normalization/types';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [topSubmissions, setTopSubmissions] = useState<any[]>([]);

  const { items: events, loading: eventsLoading } = useFirestoreCollection('events', 'label');
  const { items: units, loading: unitsLoading } = useFirestoreCollection('units', 'label');
  const { items: domains, loading: domainsLoading } = useFirestoreCollection('domains', 'label');

  function getUnitLabel(unitType: string | undefined) {
    const unitObj = units.find(u => u.value === unitType);
    return unitObj && unitObj.units && unitObj.units.length > 0 ? unitObj.units[0].label : '';
  }

  useEffect(() => {
    async function fetchData() {
      if (eventsLoading || domainsLoading) return;
      const userId = "o5NeITfIMwSQhhyV28HQ";
      const q = query(collection(db, 'submissions'), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      const submissions: Submission[] = [];
      querySnapshot.forEach(doc => {
        const data = doc.data();
        submissions.push({
          event: data.event,
          value: Number(data.value),
          userId: data.userId,
          domain: data.domain ?? (events.find(e => e.value === data.event)?.domain ?? ''),
          unit: data.unit,
          timestamp: data.timestamp ?? null,
        });
      });
      // For each domain and event, find the top (max value) submission
      const topByDomainEvent: Record<string, Record<string, Submission>> = {};
      submissions.forEach(sub => {
        if (!topByDomainEvent[sub.domain]) topByDomainEvent[sub.domain] = {};
        const current = topByDomainEvent[sub.domain][sub.event];
        if (!current || sub.value > current.value) {
          topByDomainEvent[sub.domain][sub.event] = sub;
        }
      });
      // Flatten to array for rendering
      const topSubs: any[] = [];
      domains.forEach(domain => {
        events.filter(ev => ev.domain === domain.value).forEach(ev => {
          const sub = topByDomainEvent[domain.value]?.[ev.value];
          if (sub) {
            topSubs.push({
              domain: domain.label,
              event: ev.label,
              value: sub.value,
              unit: getUnitLabel(ev.unitType),
              timestamp: sub.timestamp,
            });
          }
        });
      });
      setTopSubmissions(topSubs);
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
        <h2 className="text-xl font-bold mb-4">Top Event Submissions</h2>
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
              ) : topSubmissions.length === 0 ? (
                <tr><td colSpan={5}>No submissions found.</td></tr>
              ) : (
                topSubmissions.map((row, i) => (
                  <tr key={row.domain + '-' + row.event}>
                    <td className="px-4 py-2 border-b">{row.domain}</td>
                    <td className="px-4 py-2 border-b">{row.event}</td>
                    <td className="px-4 py-2 border-b">{row.value}</td>
                    <td className="px-4 py-2 border-b">{row.unit}</td>
                    <td className="px-4 py-2 border-b">{formatDate(row.timestamp)}</td>
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
