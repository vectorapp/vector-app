"use client";
import { useState, useEffect } from "react";
import TimePicker from 'react-time-picker';
import 'react-time-picker/dist/TimePicker.css';
import 'react-clock/dist/Clock.css';
import type { User, Event, Unit, UnitType, Domain, Submission } from '../model/types';
import { DataService } from '../model/data/access';

// Helper to convert HH:MM:SS to seconds
function timeStringToSeconds(time: string): number {
  const [h = '0', m = '0', s = '0'] = time.split(":");
  return parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(s);
}

const CURRENT_USER_ID = 'o5NeITfIMwSQhhyV28HQ';

export default function SubmitPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [unitTypes, setUnitTypes] = useState<UnitType[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [unitsLoading, setUnitsLoading] = useState(true);
  const [unitTypesLoading, setUnitTypesLoading] = useState(true);
  const [domainsLoading, setDomainsLoading] = useState(true);

  const [event, setEvent] = useState<string>('');
  const [eventValue, setEventValue] = useState("");
  const [unit, setUnit] = useState("");
  const [timedEventValue, setTimedEventValue] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userLoading, setUserLoading] = useState(true);

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
      const unitType = unitTypes.find(u => u.value === selectedEvent.unitType);
      if (unitType && unitType.units && unitType.units.length > 0) {
        setUnit(unitType.units[0].value);
      }
      setEventValue("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    const currentEvent = events.find(ev => ev.value === event);
    const currentUnitType = currentEvent ? unitTypes.find(u => u.value === currentEvent.unitType) : null;
    
    let rawValue = eventValue;
    
    if (currentUnitType?.value === "time") {
      rawValue = eventValue;
    }
    
    const submission: Omit<Submission, 'id'> = {
      userId: currentUser.id || '',
      event,
      rawValue: rawValue,
      unit: currentUnitType?.value === "time" ? undefined : unit
    };
    
    try {
      await DataService.createSubmission(submission);
      alert('Submission saved!');
      setEventValue("");
      if (currentUnitType?.value === "time") setTimedEventValue(null);
    } catch (error) {
      alert('Error saving submission: ' + error);
    }
  };

  const currentEvent = events.find(ev => ev.value === event);
  const currentUnitType = currentEvent ? unitTypes.find(u => u.value === currentEvent.unitType) : null;
  const availableUnits = currentUnitType
    ? units.filter(u => (currentUnitType.units || []).some(unit => unit.value === u.value))
    : [];

  // Debug logging
  console.log('currentUser:', currentUser);
  console.log('currentEvent:', currentEvent);
  console.log('currentUnitType:', currentUnitType);
  console.log('availableUnits:', availableUnits);

  // Group events by domain for optgroup
  const eventsByDomain = domains.map(domain => ({
    domain: domain.value,
    label: domain.label,
    events: events.filter(ev => ev.domain === domain.value)
  }));

  if (eventsLoading || unitsLoading || unitTypesLoading || domainsLoading || userLoading) {
    return <div className="text-center mt-10">Loading...</div>;
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow text-black">
      <h1 className="text-2xl font-bold mb-6 text-center">Submit Performance</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          Event
          <select
            value={event}
            onChange={handleEventChange}
            className="border rounded px-2 py-1"
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
        </label>
        <label className="flex flex-col gap-1">
          Value
          {currentUnitType?.value === "time" ? (
            <TimePicker
              onChange={setTimedEventValue}
              value={timedEventValue}
              format="HH:mm:ss"
              disableClock
              clearIcon={null}
              className="border rounded px-2 py-1"
              required
              disabled={!currentUser}
            />
          ) : (
            <input
              type="number"
              value={eventValue}
              onChange={e => setEventValue(e.target.value)}
              className="border rounded px-2 py-1"
              required
              disabled={!currentUser}
            />
          )}
        </label>
        {/* Only show Unit field if not a time-based event */}
        {currentUnitType?.value !== "time" && (
          <label className="flex flex-col gap-1">
            Unit
            <select
              value={unit}
              onChange={e => setUnit(e.target.value)}
              className="border rounded px-2 py-1"
              disabled={!currentUser}
            >
              {availableUnits.map(u => (
                <option key={u.value} value={u.value}>{u.label}</option>
              ))}
            </select>
          </label>
        )}
        <button
          type="submit"
          className="bg-blue-600 text-white rounded px-4 py-2 font-semibold hover:bg-blue-700 transition"
          disabled={!currentUser}
        >
          Submit
        </button>
      </form>
    </div>
  );
} 