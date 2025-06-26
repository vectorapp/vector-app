"use client";
import { useState, useEffect } from "react";
import TimePicker from 'react-time-picker';
import 'react-time-picker/dist/TimePicker.css';
import 'react-clock/dist/Clock.css';
import { FiThumbsUp, FiMessageCircle, FiShare } from 'react-icons/fi';
import { GiJumpingRope, GiSprint, GiStairsGoal, GiWeightLiftingUp, GiPathDistance } from 'react-icons/gi';
import { FaDumbbell, FaRunning, FaBolt, FaHeartbeat, FaRoad } from 'react-icons/fa';
import type { User, Event, Unit, UnitType, Domain, Submission } from './model/types';
import { DataService } from './model/data/access/service';

// Helper to convert HH:MM:SS to seconds
function timeStringToSeconds(time: string): number {
  const [h = '0', m = '0', s = '0'] = time.split(":");
  return parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(s);
}

// Helper to format date
function formatDate(date: any): string {
  if (!date) return '';
  // Firestore Timestamp object
  if (typeof date.toDate === 'function') {
    date = date.toDate();
  }
  // If it's a string or number, try to parse it
  if (typeof date === 'string' || typeof date === 'number') {
    date = new Date(date);
  }
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return '';
  }
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  
  if (diffInHours < 1) {
    const diffInMinutes = Math.floor(diffInHours * 60);
    return `${diffInMinutes}m ago`;
  } else if (diffInHours < 24) {
    return `${Math.floor(diffInHours)}h ago`;
  } else {
    return date.toLocaleDateString();
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

const CURRENT_USER_ID = 'o5NeITfIMwSQhhyV28HQ';

const domainIcons = {
  'agility-coordination': GiJumpingRope,
  'anaerobic-power-speed': GiSprint,
  'muscular-endurance': GiStairsGoal,
  'muscular-strength': GiWeightLiftingUp,
  'olympic-lifting': GiWeightLiftingUp,
  'steady-state-endurance': GiPathDistance,
};

export default function Home() {
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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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

  // Fetch current user using DataService
  useEffect(() => {
    async function fetchUser() {
      setUserLoading(true);
      try {
        const user = await DataService.getUserById(CURRENT_USER_ID);
        setCurrentUser(user);
      } catch (error) {
        console.error('Error fetching user:', error);
        setCurrentUser(null);
      }
      setUserLoading(false);
    }
    fetchUser();
  }, []);

  // Fetch user submissions
  useEffect(() => {
    async function fetchSubmissions() {
      if (!currentUser) return;
      
      setSubmissionsLoading(true);
      try {
        const userSubmissions = await DataService.getSubmissionsByUserId(currentUser.id || currentUser.email);
        setSubmissions(userSubmissions);
      } catch (error) {
        console.error('Error fetching submissions:', error);
        setSubmissions([]);
      }
      setSubmissionsLoading(false);
    }
    fetchSubmissions();
  }, [currentUser]);

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
    if (!currentUser) return;
    
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
      user: currentUser,
      event: currentEvent,
      rawValue: rawValue,
      value: value,
      unit: selectedUnit
    };
    
    try {
      await DataService.createSubmission(submission);
      // Refresh submissions
      const userSubmissions = await DataService.getSubmissionsByUserId(currentUser.id || currentUser.email);
      setSubmissions(userSubmissions);
      // Reset form
      setEventValue("");
      if (currentUnitType?.value === "time") setTimedEventValue(null);
      setShowNewPostForm(false);
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
          <p className="text-gray-600">Loading your Scalar feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-6">
        {/* Plain Feed Header */}
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Feed</h1>

        {/* Social Media Style New Post Input */}
        {!showNewPostForm && (
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex items-center gap-3 cursor-pointer" onClick={() => setShowNewPostForm(true)}>
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-700 text-lg">
              {currentUser?.firstName ? currentUser.firstName[0] : (currentUser?.email ? currentUser.email[0].toUpperCase() : '?')}
            </div>
            <div className="flex-1 text-gray-500 text-base">
              {"What's your latest workout or achievement?"}
            </div>
          </div>
        )}

        {/* New Post Form (expanded) */}
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  disabled={!currentUser}
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    required
                    disabled={!currentUser}
                  />
                ) : (
                  <input
                    type="number"
                    value={eventValue}
                    onChange={e => setEventValue(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    required
                    disabled={!currentUser}
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    disabled={!currentUser}
                  >
                    {availableUnits.map(u => (
                      <option key={u.value} value={u.value}>{u.label}</option>
                    ))}
                  </select>
                </div>
              )}

              <button
                type="submit"
                disabled={!currentUser || submitting}
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
            submissions.map((submission) => {
              console.log('=== SUBMISSION MAPPING DEBUG ===');
              console.log('submission.id:', submission.id);
              console.log('submission.user:', submission.user);
              console.log('submission.event:', submission.event);
              console.log('submission.value:', submission.value);
              console.log('submission.rawValue:', submission.rawValue);
              console.log('submission.unit:', submission.unit);
              console.log('submission.createdAt:', submission.createdAt);
              console.log('submission.event.unitType:', submission.event.unitType);
              
              console.log('submission.user', submission.user);
              let userName = 'Unknown User';
              let userInitials = '?';
              if (submission.user) {
                console.log('User data exists, checking type...');
                if (typeof submission.user === 'string') {
                  console.log('User is string type, using as userName');
                  userName = submission.user;
                  userInitials = userName.charAt(0).toUpperCase();
                } else if (submission.user.firstName || submission.user.lastName) {
                  console.log('User has firstName/lastName, combining them');
                  userName = `${submission.user.firstName || ''} ${submission.user.lastName || ''}`.trim();
                  userInitials = `${submission.user.firstName?.charAt(0) || ''}${submission.user.lastName?.charAt(0) || ''}`.toUpperCase();
                } else if (submission.user.email) {
                  console.log('User has email, using as userName');
                  userName = submission.user.email;
                  userInitials = userName.charAt(0).toUpperCase();
                } else {
                  console.log('User object exists but no usable name fields found');
                }
              } else {
                console.log('No user data found, using default "Unknown User"');
              }
              const DomainIcon = domainIcons[submission.event.domain.value as keyof typeof domainIcons] || FaDumbbell;
              return (
                <div key={submission.id} className="bg-white rounded-lg shadow-sm p-6">
                  {/* User name and date row */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-blue-700">{userInitials}</span>
                      </div>
                      <span className="font-semibold text-gray-900">{userName}</span>
                    </div>
                    <span className="text-sm text-gray-500">{formatDate(submission.createdAt)}</span>
                  </div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{submission.event.label}</h3>
                        {submission.event.description && (
                          <p className="text-xs text-gray-400 mt-0.5">{submission.event.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 justify-between">
                    <div>
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
                    <div className="flex items-center gap-2 text-right flex-1 justify-end items-end">
                      <DomainIcon className="w-5 h-5 text-blue-400" />
                      <span className="inline-block rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500">{submission.event.domain.label}</span>
                    </div>
                  </div>
                  {/* Reaction icons row */}
                  <div className="flex items-center gap-8 mt-4 text-gray-500">
                    <button className="flex items-center gap-1 hover:text-blue-600 transition-colors">
                      <FiThumbsUp className="w-5 h-5" />
                      <span className="text-sm font-medium">Like</span>
                    </button>
                    <button className="flex items-center gap-1 hover:text-blue-600 transition-colors">
                      <FiMessageCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">Comment</span>
                    </button>
                    <button className="flex items-center gap-1 hover:text-blue-600 transition-colors">
                      <FiShare className="w-5 h-5" />
                      <span className="text-sm font-medium">Share</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
