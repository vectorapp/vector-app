"use client";
import { useState, useEffect } from "react";
import TimePicker from 'react-time-picker';
import 'react-time-picker/dist/TimePicker.css';
import 'react-clock/dist/Clock.css';
import type { User, Event, Unit, UnitType, Domain, Submission } from '../model/types';
import { DataService } from '../model/data/access/service';
import { useUser } from '../model/auth/UserContext';
import { useRouter } from 'next/navigation';

// Helper to convert HH:MM:SS to seconds
function timeStringToSeconds(time: string): number {
  const [h = '0', m = '0', s = '0'] = time.split(":");
  return parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(s);
}

// Helper to format date
function formatDate(date: any): string {
  if (!date) return '';
  const d = new Date(date);
  const now = new Date();
  const diffInHours = (now.getTime() - d.getTime()) / (1000 * 60 * 60);
  
  if (diffInHours < 1) {
    const diffInMinutes = Math.floor(diffInHours * 60);
    return `${diffInMinutes}m ago`;
  } else if (diffInHours < 24) {
    return `${Math.floor(diffInHours)}h ago`;
  } else {
    return d.toLocaleDateString();
  }
}

// Helper to format time value
function formatTimeValue(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}

export default function SubmitPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  
  const [events, setEvents] = useState<Event[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [unitTypes, setUnitTypes] = useState<UnitType[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [unitsLoading, setUnitsLoading] = useState(true);
  const [unitTypesLoading, setUnitTypesLoading] = useState(true);
  const [domainsLoading, setDomainsLoading] = useState(true);
  const [submissionsLoading, setSubmissionsLoading] = useState(true);

  const [showNewPostForm, setShowNewPostForm] = useState(false);
  const [event, setEvent] = useState<string>('');
  const [eventValue, setEventValue] = useState("");
  const [unit, setUnit] = useState("");
  const [timedEventValue, setTimedEventValue] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login');
    }
  }, [user, userLoading, router]);

  // Fetch all data using DataService
  useEffect(() => {
    async function fetchData() {
      try {
        const [eventsData, unitsData, unitTypesData, domainsData] = await Promise.all([
          DataService.getAllEvents(),
          DataService.getAllUnits(),
          DataService.getAllUnitTypes(),
          DataService.getAllDomains()
        ]);
        
        setEvents(eventsData);
        setUnits(unitsData);
        setUnitTypes(unitTypesData);
        setDomains(domainsData);
        
        setEventsLoading(false);
        setUnitsLoading(false);
        setUnitTypesLoading(false);
        setDomainsLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setEventsLoading(false);
        setUnitsLoading(false);
        setUnitTypesLoading(false);
        setDomainsLoading(false);
      }
    }
    fetchData();
  }, []);

  // Fetch user submissions
  useEffect(() => {
    async function fetchSubmissions() {
      if (!user) return;
      
      setSubmissionsLoading(true);
      try {
        const userSubmissions = await DataService.getSubmissionsByUserId(user.id || user.email);
        setSubmissions(userSubmissions);
      } catch (error) {
        console.error('Error fetching submissions:', error);
        setSubmissions([]);
      }
      setSubmissionsLoading(false);
    }
    fetchSubmissions();
  }, [user]);

  // Set default event when events are loaded
  useEffect(() => {
    if (!eventsLoading && events.length > 0 && !event) {
      setEvent(events[0].value);
    }
  }, [eventsLoading, events, event]);

  const handleEventChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedEvent = events.find(ev => ev.value === e.target.value);
    if (selectedEvent) {
      setEvent(e.target.value);
      // Find the unit type and set the first available unit
      if (selectedEvent.unitType && selectedEvent.unitType.units && selectedEvent.unitType.units.length > 0) {
        setUnit(selectedEvent.unitType.units[0].value);
      }
      setEventValue("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setSubmitting(true);
    
    const currentEvent = events.find(ev => ev.value === event);
    const currentUnitType = currentEvent?.unitType;
    
    // Determine rawValue and calculate value based on event type
    let rawValue: string;
    let value: number;
    let selectedUnit: Unit | null = null;
    
    if (currentUnitType?.value === "time") {
      // For timed events, use the TimePicker value
      rawValue = timedEventValue || "00:00:00";
      value = timeStringToSeconds(rawValue);
      selectedUnit = null;
    } else {
      // For other events, use the number input value
      rawValue = eventValue;
      value = parseFloat(eventValue) || 0;
      selectedUnit = units.find(u => u.value === unit) || null;
    }
    
    if (!currentEvent) {
      alert('Please select a valid event');
      setSubmitting(false);
      return;
    }
    
    const submission: Omit<Submission, 'id'> = {
      user: user,
      event: currentEvent,
      rawValue: rawValue,
      value: value,
      unit: selectedUnit
    };
    
    try {
      await DataService.createSubmission(submission);
      
      // Refresh submissions
      const userSubmissions = await DataService.getSubmissionsByUserId(user.id || user.email);
      setSubmissions(userSubmissions);
      
      // Reset form
      setEventValue("");
      if (currentUnitType?.value === "time") setTimedEventValue(null);
      setShowNewPostForm(false);
      
      // Show success message
      alert('Performance logged successfully! 🎉');
    } catch (error) {
      alert('Error saving submission: ' + error);
    } finally {
      setSubmitting(false);
    }
  };

  const currentEvent = events.find(ev => ev.value === event);
  const currentUnitType = currentEvent?.unitType;
  const availableUnits = currentUnitType
    ? currentUnitType.units || []
    : [];

  // Group events by domain for optgroup
  const eventsByDomain = domains.map(domain => ({
    domain: domain.value,
    label: domain.label,
    events: events.filter(ev => ev.domain.value === domain.value)
  }));

  if (eventsLoading || unitsLoading || unitTypesLoading || domainsLoading || userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your fitness feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Fitness Feed</h1>
          <p className="text-gray-600">Track your progress and see your recent achievements</p>
        </div>

        {/* New Post Button */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <button
            onClick={() => setShowNewPostForm(!showNewPostForm)}
            className="w-full bg-blue-600 text-white rounded-lg px-6 py-3 font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {showNewPostForm ? 'Cancel' : 'Log New Performance'}
          </button>
        </div>

        {/* New Post Form */}
        {showNewPostForm && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Log New Performance</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Activity
                </label>
                <select
                  value={event}
                  onChange={handleEventChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={!user}
                >
                  {eventsByDomain.map(group => (
                    <optgroup key={group.domain} label={group.label}>
                      {group.events.map(ev => (
                        <option key={ev.value} value={ev.value}>{ev.label}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {currentUnitType?.value === "time" ? "Time" : "Value"}
                </label>
                {currentUnitType?.value === "time" ? (
                  <TimePicker
                    onChange={setTimedEventValue}
                    value={timedEventValue}
                    format="HH:mm:ss"
                    disableClock
                    clearIcon={null}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                    disabled={!user}
                  />
                ) : (
                  <input
                    type="number"
                    value={eventValue}
                    onChange={e => setEventValue(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                    disabled={!user}
                    placeholder="Enter your value"
                  />
                )}
              </div>

              {currentUnitType?.value !== "time" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit
                  </label>
                  <select
                    value={unit}
                    onChange={e => setUnit(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={!user}
                  >
                    {availableUnits.map(u => (
                      <option key={u.value} value={u.value}>{u.label}</option>
                    ))}
                  </select>
                </div>
              )}

              <button
                type="submit"
                disabled={!user || submitting}
                className="w-full bg-green-600 text-white rounded-lg px-6 py-3 font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Logging...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Log Performance
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Feed */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
          
          {submissionsLoading ? (
            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600">Loading your activity...</p>
            </div>
          ) : submissions.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No activity yet</h3>
              <p className="text-gray-600 mb-4">Start tracking your fitness journey by logging your first performance!</p>
              <button
                onClick={() => setShowNewPostForm(true)}
                className="bg-blue-600 text-white rounded-lg px-4 py-2 font-medium hover:bg-blue-700 transition-colors"
              >
                Log Your First Activity
              </button>
            </div>
          ) : (
            submissions.map((submission) => (
              <div key={submission.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{submission.event.label}</h3>
                      <p className="text-sm text-gray-500">{submission.event.domain.label}</p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">{formatDate(submission.createdAt)}</span>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="text-2xl font-bold text-gray-900">
                      {submission.event.unitType.value === "time" 
                        ? formatTimeValue(submission.value)
                        : submission.rawValue
                      }
                    </div>
                    <div className="text-sm text-gray-600">
                      {submission.event.unitType.value === "time" 
                        ? "Time"
                        : submission.unit ? submission.unit.label : "Units"
                      }
                    </div>
                  </div>
                  
                  {submission.event.unitType.value !== "time" && submission.unit && (
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">{submission.unit.label}</div>
                      <div className="text-xs text-gray-500">Unit</div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 