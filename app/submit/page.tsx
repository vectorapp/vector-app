"use client";
import { useState } from "react";

const UNITS = [
  { label: "Weight", value: "weight", units: ["kg", "lbs"] },
  { label: "Distance", value: "distance", units: ["feet", "inches", "meters", "centimeters"] },
  { label: "Time", value: "time", units: ["seconds", "minutes"] },
  { label: "Sets", value: "sets", units: ["sets"] },
  { label: "Reps", value: "reps", units: ["reps"] },
]

const EVENTS = [
  // strength
  { label: "1RM Deadlift", value: "deadlift", units: UNITS.filter(u => u.value === "weight") },
  { label: "1RM Back Squat", value: "backsquat", units: UNITS.filter(u => u.value === "weight") },
  { label: "1RM Bench Press", value: "benchpress", units: UNITS.filter(u => u.value === "weight") },
  { label: "1RM Military Press", value: "deadlift", units: UNITS.filter(u => u.value === "weight") },

  // muscular endurance
  { label: "Pull-Ups", value: "pullups", units: UNITS.filter(u => u.value === "reps") },
  { label: "Push-Ups", value: "pushups", units: UNITS.filter(u => u.value === "reps") },
  { label: "Air Squats", value: "airsquats", units: UNITS.filter(u => u.value === "reps") },
  { label: "Sit-Ups", value: "situps", units: UNITS.filter(u => u.value === "reps") },
  { label: "Plank Hold", value: "plank", units: UNITS.filter(u => u.value === "time") },

  // olympic lifting
  // { label: "Snatch", value: "snatch", units: UNITS.filter(u => u.value === "weight") },
  { label: "Clean & Jerk", value: "cleanjerk", units: UNITS.filter(u => u.value === "weight") },

  // endurance
  { label: "5K Run", value: "5krun", units: UNITS.filter(u => u.value === "time") },
];

export default function SubmitPage() {
  const [event, setEvent] = useState(EVENTS[0].value);
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState(EVENTS[0].units[0]);

  const handleEventChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedEvent = EVENTS.find(ev => ev.value === e.target.value);
    setEvent(e.target.value);
    setUnit(selectedEvent?.units[0] || "");
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

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
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
            {currentEvent?.units.map(u => (
              <option key={u} value={u}>{u}</option>
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