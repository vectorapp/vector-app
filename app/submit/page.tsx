"use client";
import { useState } from "react";
import TimePicker from 'react-time-picker';
import 'react-time-picker/dist/TimePicker.css';
import 'react-clock/dist/Clock.css';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const DOMAINS = [
  {
    label: "Muscular Strength",
    value: "muscular-strength",
  },
  {
    label: "Muscular Endurance",
    value: "muscular-endurance",
  },
  {
    label: "Olympic Lifting",
    value: "olympic-lifting",
  },
  {
    label: "Anaerobic Power/Speed",
    value: "anaerobic-power-speed",
  },
  {
    label: "Steady-State Endurance",
    value: "steady-state-endurance",
  },
  {
    label: "Agility & Coordination",
    value: "agility-coordination",
  }
]
const UNITS = [
  { 
    label: "Weight", 
    value: "weight", 
    units: [
      { label: "Kilograms", value: "kg" },
      { label: "Pounds", value: "lbs" }
    ]
  },
  { 
    label: "Distance", 
    value: "distance", 
    units: [
      { label: "Feet", value: "ft" },
      { label: "Inches", value: "in" },
      { label: "Meters", value: "m" },
      { label: "Centimeters", value: "cm" }
    ]
  },
  { 
    label: "Time", 
    value: "time", 
    units: [
      { label: "Seconds", value: "sec" },
      { label: "Minutes", value: "min" }
    ]
  },
  { 
    label: "Repetitions", 
    value: "reps", 
    units: [
      { label: "Reps", value: "reps" }
    ]
  },
  { 
    label: "Calories", 
    value: "calories", 
    units: [
      { label: "Calories", value: "cal" }
    ]
  }
];

const EVENTS = [
  // domain: musuclar strength
  { label: "1RM Deadlift", value: "deadlift", unitType: UNITS.find(u => u.value === "weight")?.value, domain: DOMAINS.find(d => d.value === "muscular-strength")?.value },
  { label: "1RM Back Squat", value: "backsquat", unitType: UNITS.find(u => u.value === "weight")?.value, domain: DOMAINS.find(d => d.value === "muscular-strength")?.value },
  { label: "1RM Bench Press", value: "benchpress", unitType: UNITS.find(u => u.value === "weight")?.value, domain: DOMAINS.find(d => d.value === "muscular-strength")?.value },
  { label: "1RM Military Press", value: "militarypress", unitType: UNITS.find(u => u.value === "weight")?.value, domain: DOMAINS.find(d => d.value === "muscular-strength")?.value },

  // domain: muscular endurance
  { label: "Max Pull-Ups / 60 Seconds", value: "pullups", unitType: UNITS.find(u => u.value === "reps")?.value, domain: DOMAINS.find(d => d.value === "muscular-endurance")?.value },
  { label: "Max Push-Ups / 60 Seconds", value: "pushups", unitType: UNITS.find(u => u.value === "reps")?.value, domain: DOMAINS.find(d => d.value === "muscular-endurance")?.value },
  { label: "Max Air Squats / 60 Seconds", value: "airsquats", unitType: UNITS.find(u => u.value === "reps")?.value, domain: DOMAINS.find(d => d.value === "muscular-endurance")?.value },
  { label: "Max Sit-Ups / 60 Seconds", value: "situps", unitType: UNITS.find(u => u.value === "reps")?.value, domain: DOMAINS.find(d => d.value === "muscular-endurance")?.value },

  // domain: olympic lifting
  { label: "1RM Snatch", value: "snatch", unitType: UNITS.find(u => u.value === "weight")?.value, domain: DOMAINS.find(d => d.value === "olympic-lifting")?.value },
  { label: "1RM Clean & Jerk", value: "cleanjerk", unitType: UNITS.find(u => u.value === "weight")?.value, domain: DOMAINS.find(d => d.value === "olympic-lifting")?.value },

  // domain: steady-state endurance
  { label: "5K Run", value: "5krun", unitType: UNITS.find(u => u.value === "time")?.value, domain: DOMAINS.find(d => d.value === "steady-state-endurance")?.value },
  { label: "1000M Row", value: "1000mrow", unitType: UNITS.find(u => u.value === "time")?.value, domain: DOMAINS.find(d => d.value === "steady-state-endurance")?.value },

  // domain: anaerobic power/speed
  { label: "400M Run", value: "400mrun", unitType: UNITS.find(u => u.value === "time")?.value, domain: DOMAINS.find(d => d.value === "anaerobic-power-speed")?.value },
  { label: "Assault Bike Max Calories / 60 seconds", value: "assaultbike", unitType: UNITS.find(u => u.value === "calories")?.value, domain: DOMAINS.find(d => d.value === "anaerobic-power-speed")?.value },

  // domain: agility & coordination
  { label: "Shuttle Run", value: "shuttlerun", unitType: UNITS.find(u => u.value === "time")?.value, domain: DOMAINS.find(d => d.value === "agility-coordination")?.value },
  { label: "T-Test", value: "t-test", unitType: UNITS.find(u => u.value === "time")?.value, domain: DOMAINS.find(d => d.value === "agility-coordination")?.value },
];

// Helper to convert HH:MM:SS to seconds
function timeStringToSeconds(time: string): number {
  const [h = '0', m = '0', s = '0'] = time.split(":");
  return parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(s);
}

export default function SubmitPage() {
  const [event, setEvent] = useState(EVENTS[0].value);
  const [eventValue, setEventValue] = useState("");
  const [unit, setUnit] = useState("");
  const [timedEventValue, setTimedEventValue] = useState<string | null>(null);

  const handleEventChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedEvent = EVENTS.find(ev => ev.value === e.target.value);
    if (selectedEvent) {
      setEvent(e.target.value);
      // Find the unit type and set the first available unit
      const unitType = UNITS.find(u => u.value === selectedEvent.unitType);
      if (unitType) {
        setUnit(unitType.units[0].value);
      }
      setEventValue("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let normalizedValue = eventValue;
    let rawValue = eventValue;
    if (currentUnitType?.value === "time") {
      normalizedValue = timeStringToSeconds(eventValue).toString();
      rawValue = eventValue;
    }
    const submission = {
      userId: "nlayton",
      event,
      value: normalizedValue,
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

  const currentEvent = EVENTS.find(ev => ev.value === event);
  const currentUnitType = currentEvent ? UNITS.find(u => u.value === currentEvent.unitType) : null;
  const availableUnits = currentUnitType?.units || [];

  const domains = Array.from(new Set(EVENTS.map(ev => ev.domain)));
  

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
            {domains.map(domain => (
              <optgroup key={domain} label={DOMAINS.find(d => d.value === domain)?.label}>
                {EVENTS.filter(ev => ev.domain === domain).map(ev => (
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