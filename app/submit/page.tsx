"use client";
import { useState } from "react";

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
  // strength
  { label: "1RM Deadlift", value: "deadlift", unitType: "weight" },
  { label: "1RM Back Squat", value: "backsquat", unitType: "weight" },
  { label: "1RM Bench Press", value: "benchpress", unitType: "weight" },
  { label: "1RM Military Press", value: "militarypress", unitType: "weight" },

  // muscular endurance
  { label: "Pull-Ups", value: "pullups", unitType: "reps" },
  { label: "Push-Ups", value: "pushups", unitType: "reps" },
  { label: "Air Squats", value: "airsquats", unitType: "reps" },
  { label: "Sit-Ups", value: "situps", unitType: "reps" },

  // olympic lifting
  { label: "Snatch", value: "snatch", unitType: "weight" },
  { label: "Clean & Jerk", value: "cleanjerk", unitType: "weight" },

  // steady-state endurance
  { label: "5K Run", value: "5krun", unitType: "time" },
  { label: "1000M Row", value: "1000mrow", unitType: "time" },

  // anaerobic power/speed
  { label: "400M Run", value: "400mrun", unitType: "time" },
  { label: "Assault Bike Max Calories / 60 seconds", value: "assaultbike", unitType: "calories" },

  // agility & coordination
  { label: "Shuttle Run", value: "shuttlerun", unitType: "time" },
  { label: "T-Test", value: "t-test", unitType: "time" },
];

export default function SubmitPage() {
  const [event, setEvent] = useState(EVENTS[0].value);
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState("");

  const handleEventChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedEvent = EVENTS.find(ev => ev.value === e.target.value);
    if (selectedEvent) {
      setEvent(e.target.value);
      // Find the unit type and set the first available unit
      const unitType = UNITS.find(u => u.value === selectedEvent.unitType);
      if (unitType) {
        setUnit(unitType.units[0].value);
      }
      setValue("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submission = {
      user: "nick@vector.dev",
      event,
      value,
      unit,
    };
    console.log("Submission:", submission);
    // Future: send to API
  };

  const currentEvent = EVENTS.find(ev => ev.value === event);
  const currentUnitType = currentEvent ? UNITS.find(u => u.value === currentEvent.unitType) : null;
  const availableUnits = currentUnitType?.units || [];

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
            {EVENTS.map(ev => (
              <option key={ev.value} value={ev.value}>{ev.label}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          Value
          <input
            type="number"
            value={value}
            onChange={e => setValue(e.target.value)}
            className="border rounded px-2 py-1"
            required
          />
        </label>
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