"use client";
import { useState, useEffect } from "react";
import TimePicker from 'react-time-picker';
import 'react-time-picker/dist/TimePicker.css';
import 'react-clock/dist/Clock.css';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useFirestoreCollection } from '../lib/useFirestoreCollection';

// Helper to convert HH:MM:SS to seconds
function timeStringToSeconds(time: string): number {
  const [h = '0', m = '0', s = '0'] = time.split(":");
  return parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(s);
}

export default function SubmitPage() {
  const { items: events, loading: eventsLoading } = useFirestoreCollection('events', 'label');
  const { items: units, loading: unitsLoading } = useFirestoreCollection('units', 'label');
  const { items: unitTypes, loading: unitTypesLoading } = useFirestoreCollection('unitTypes', 'label');
  const { items: domains, loading: domainsLoading } = useFirestoreCollection('domains', 'label');

  const [event, setEvent] = useState<string>('');
  const [eventValue, setEventValue] = useState("");
  const [unit, setUnit] = useState("");
  const [timedEventValue, setTimedEventValue] = useState<string | null>(null);

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
    const currentEvent = events.find(ev => ev.value === event);
    const currentUnitType = currentEvent ? unitTypes.find(u => u.value === currentEvent.unitType) : null;
    let normalizedValue = eventValue;
    let rawValue = eventValue;
    if (currentUnitType?.value === "time") {
      normalizedValue = timeStringToSeconds(eventValue).toString();
      rawValue = eventValue;
    }
    const submission = {
      userId: "nlayton",
      event,
      normalizedValue: normalizedValue,
      unit: currentUnitType?.value === "time" ? undefined : unit,
      timestamp: serverTimestamp(),
      rawValue: rawValue,
    };
    try {
      await addDoc(collection(db, 'submissions'), submission);
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
    ? units.filter(u => (currentUnitType.units || []).includes(u.value))
    : [];

  // Debug logging
  console.log('currentEvent:', currentEvent);
  console.log('currentUnitType:', currentUnitType);
  console.log('availableUnits:', availableUnits);

  // Group events by domain for optgroup
  const eventsByDomain = domains.map(domain => ({
    domain: domain.value,
    label: domain.label,
    events: events.filter(ev => ev.domain === domain.value)
  }));

  if (eventsLoading || unitsLoading || unitTypesLoading || domainsLoading) {
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
            />
          ) : (
            <input
              type="number"
              value={eventValue}
              onChange={e => setEventValue(e.target.value)}
              className="border rounded px-2 py-1"
              required
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
        >
          Submit
        </button>
      </form>
    </div>
  );
} 