"use client";
import { useEffect, useState } from 'react';
import { DataService } from './model/data/access/service';
import type { Event, Unit, Domain, Submission } from './model/types';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [latestSubmissions, setLatestSubmissions] = useState<Submission[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [unitsLoading, setUnitsLoading] = useState(true);
  const [domainsLoading, setDomainsLoading] = useState(true);

  // Fetch all data using DataService
  useEffect(() => {
    async function fetchData() {
      try {
        const [eventsData, unitsData, domainsData] = await Promise.all([
          DataService.getAllEvents(),
          DataService.getAllUnits(),
          DataService.getAllDomains()
        ]);
        
        setEvents(eventsData);
        setUnits(unitsData);
        setDomains(domainsData);
        
        setEventsLoading(false);
        setUnitsLoading(false);
        setDomainsLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setEventsLoading(false);
        setUnitsLoading(false);
        setDomainsLoading(false);
      }
    }
    fetchData();
  }, []);

  function getUnitLabel(unitType: string | undefined) {
    // This function is no longer needed since we're using the DataService approach
    return '';
  }

  function getEventLabel(eventId: string) {
    const event = events.find((e) => e.value === eventId);
    return event ? event.label : eventId;
  }

  function getDomainLabel(domainId: string) {
    const domain = domains.find((d) => d.value === domainId);
    return domain ? domain.label : domainId;
  }

  // Fetch submissions using DataService
  useEffect(() => {
    async function fetchSubmissions() {
      if (eventsLoading || domainsLoading) return;
      const userId = "o5NeITfIMwSQhhyV28HQ";
      
      try {
        const submissions = await DataService.getSubmissionsByUserId(userId);
        console.log('Latest submissions:', submissions);
        setLatestSubmissions(submissions.slice(0, 20)); // Limit to 20
        setLoading(false);
      } catch (error) {
        console.error('Error fetching submissions:', error);
        setLoading(false);
      }
    }
    fetchSubmissions();
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
                latestSubmissions.map((submission, i) => {
                  const event = events.find(e => e.value === submission.event);
                  const domain = event ? domains.find(d => d.value === event.domain) : null;
                  const unit = submission.unit ? units.find(u => u.value === submission.unit) : null;
                  
                  return (
                    <tr key={submission.id || i}>
                      <td className="px-4 py-2 border-b">{domain?.label || '-'}</td>
                      <td className="px-4 py-2 border-b">{event?.label || submission.event}</td>
                      <td className="px-4 py-2 border-b">{submission.rawValue}</td>
                      <td className="px-4 py-2 border-b">{unit?.label || '-'}</td>
                      <td className="px-4 py-2 border-b">{formatDate(submission.createdAt)}</td>
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
