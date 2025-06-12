export const DOMAINS = [
  { label: "Strength", value: "strength" },
  { label: "Muscular Endurance", value: "muscular-endurance" },
  { label: "Olympic Lifting", value: "olympic-lifting" },
  { label: "Steady-State Endurance", value: "steady-state-endurance" },
  { label: "Anaerobic Power/Speed", value: "anaerobic-power-speed" },
  { label: "Agility & Coordination", value: "agility-coordination" },
];

export const UNITS = [
  { 
    label: "Weight", 
    value: "weight", 
    units: [
      { label: "Pounds", value: "lbs" },
      { label: "Kilograms", value: "kg" },
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

export const EVENTS = [
  // strength
  { label: "1RM Deadlift", value: "deadlift", unitType: UNITS.find(u => u.value === "weight")?.value, domain: DOMAINS.find(d => d.value === "strength")?.value },
  { label: "1RM Back Squat", value: "backsquat", unitType: UNITS.find(u => u.value === "weight")?.value, domain: DOMAINS.find(d => d.value === "strength")?.value },
  { label: "1RM Bench Press", value: "benchpress", unitType: UNITS.find(u => u.value === "weight")?.value, domain: DOMAINS.find(d => d.value === "strength")?.value },
  { label: "1RM Military Press", value: "militarypress", unitType: UNITS.find(u => u.value === "weight")?.value, domain: DOMAINS.find(d => d.value === "strength")?.value },

  // muscular endurance
  { label: "Pull-Ups", value: "pullups", unitType: UNITS.find(u => u.value === "reps")?.value, domain: DOMAINS.find(d => d.value === "muscular-endurance")?.value },
  { label: "Push-Ups", value: "pushups", unitType: UNITS.find(u => u.value === "reps")?.value, domain: DOMAINS.find(d => d.value === "muscular-endurance")?.value },
  { label: "Air Squats", value: "airsquats", unitType: UNITS.find(u => u.value === "reps")?.value, domain: DOMAINS.find(d => d.value === "muscular-endurance")?.value },
  { label: "Sit-Ups", value: "situps", unitType: UNITS.find(u => u.value === "reps")?.value, domain: DOMAINS.find(d => d.value === "muscular-endurance")?.value },

  // olympic lifting
  { label: "Snatch", value: "snatch", unitType: UNITS.find(u => u.value === "weight")?.value, domain: DOMAINS.find(d => d.value === "olympic-lifting")?.value },
  { label: "Clean & Jerk", value: "cleanjerk", unitType: UNITS.find(u => u.value === "weight")?.value, domain: DOMAINS.find(d => d.value === "olympic-lifting")?.value },

  // steady-state endurance
  { label: "5K Run", value: "5krun", unitType: UNITS.find(u => u.value === "time")?.value, domain: DOMAINS.find(d => d.value === "steady-state-endurance")?.value },
  { label: "1000M Row", value: "1000mrow", unitType: UNITS.find(u => u.value === "time")?.value, domain: DOMAINS.find(d => d.value === "steady-state-endurance")?.value },

  // anaerobic power/speed
  { label: "400M Run", value: "400mrun", unitType: UNITS.find(u => u.value === "time")?.value, domain: DOMAINS.find(d => d.value === "anaerobic-power-speed")?.value },
  { label: "Assault Bike Max Calories / 60 seconds", value: "assaultbike", unitType: UNITS.find(u => u.value === "calories")?.value, domain: DOMAINS.find(d => d.value === "anaerobic-power-speed")?.value },

  // agility & coordination
  { label: "Shuttle Run", value: "shuttlerun", unitType: UNITS.find(u => u.value === "time")?.value, domain: DOMAINS.find(d => d.value === "agility-coordination")?.value },
  { label: "T-Test", value: "t-test", unitType: UNITS.find(u => u.value === "time")?.value, domain: DOMAINS.find(d => d.value === "agility-coordination")?.value },
]; 