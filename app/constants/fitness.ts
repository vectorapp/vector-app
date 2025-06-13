import type { Domain, Unit, UnitType, Event } from '../lib/normalization/types';

export const DOMAINS: Domain[] = [
  { label: "Strength", value: "strength" },
  { label: "Muscular Endurance", value: "muscular-endurance" },
  { label: "Olympic Lifting", value: "olympic-lifting" },
  { label: "Steady-State Endurance", value: "steady-state-endurance" },
  { label: "Anaerobic Power/Speed", value: "anaerobic-power-speed" },
  { label: "Agility & Coordination", value: "agility-coordination" },
];

export const UNITS: UnitType[] = [
  {
    label: "Weight",
    value: "weight",
    units: [
      { label: "Pounds", value: "lbs" },
      { label: "Kilograms", value: "kg" },
    ],
  },
  {
    label: "Distance",
    value: "distance",
    units: [
      { label: "Feet", value: "ft" },
      { label: "Inches", value: "in" },
      { label: "Meters", value: "m" },
      { label: "Centimeters", value: "cm" },
    ],
  },
  {
    label: "Time",
    value: "time",
    units: [
      { label: "Seconds", value: "sec" },
      { label: "Minutes", value: "min" },
    ],
  },
  {
    label: "Repetitions",
    value: "reps",
    units: [
      { label: "Reps", value: "reps" },
    ],
  },
  {
    label: "Calories",
    value: "calories",
    units: [
      { label: "Calories", value: "cal" },
    ],
  },
];

export const EVENTS: Event[] = [
  // strength
  { label: "1RM Deadlift", value: "deadlift", unitType: "weight", domain: "strength" },
  { label: "1RM Back Squat", value: "backsquat", unitType: "weight", domain: "strength" },
  { label: "1RM Bench Press", value: "benchpress", unitType: "weight", domain: "strength" },
  { label: "1RM Military Press", value: "militarypress", unitType: "weight", domain: "strength" },

  // muscular endurance
  { label: "Pull-Ups", value: "pullups", unitType: "reps", domain: "muscular-endurance" },
  { label: "Push-Ups", value: "pushups", unitType: "reps", domain: "muscular-endurance" },
  { label: "Air Squats", value: "airsquats", unitType: "reps", domain: "muscular-endurance" },
  { label: "Sit-Ups", value: "situps", unitType: "reps", domain: "muscular-endurance" },

  // olympic lifting
  { label: "Snatch", value: "snatch", unitType: "weight", domain: "olympic-lifting" },
  { label: "Clean & Jerk", value: "cleanjerk", unitType: "weight", domain: "olympic-lifting" },

  // steady-state endurance
  { label: "5K Run", value: "5krun", unitType: "time", domain: "steady-state-endurance" },
  { label: "1000M Row", value: "1000mrow", unitType: "time", domain: "steady-state-endurance" },

  // anaerobic power/speed
  { label: "400M Run", value: "400mrun", unitType: "time", domain: "anaerobic-power-speed" },
  { label: "Assault Bike Max Calories / 60 seconds", value: "assaultbike", unitType: "calories", domain: "anaerobic-power-speed" },

  // agility & coordination
  { label: "Shuttle Run", value: "shuttlerun", unitType: "time", domain: "agility-coordination" },
  { label: "T-Test", value: "t-test", unitType: "time", domain: "agility-coordination" },
]; 