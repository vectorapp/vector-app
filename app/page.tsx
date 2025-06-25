"use client";
import { useEffect, useState } from 'react';
import { DataService } from './model/data/access/service';
import type { Submission } from './model/types';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [latestSubmissions, setLatestSubmissions] = useState<Submission[]>([]);

  // Fetch submissions using DataService
  useEffect(() => {
    async function fetchSubmissions() {
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
  }, []);

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
              {loading ? (
                <tr><td colSpan={5}>Loading...</td></tr>
              ) : latestSubmissions.length === 0 ? (
                <tr><td colSpan={5}>No submissions found.</td></tr>
              ) : (
                latestSubmissions.map((submission, i) => {
                  return (
                    <tr key={submission.id || i}>
                      <td className="px-4 py-2 border-b">{submission.event.domain.label}</td>
                      <td className="px-4 py-2 border-b">{submission.event.label}</td>
                      <td className="px-4 py-2 border-b">{submission.rawValue}</td>
                      <td className="px-4 py-2 border-b">{submission.unit?.label || '-'}</td>
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
