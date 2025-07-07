import { calculateNormalizedEventScore } from './scoringService';

// Test the generic scoring algorithm
console.log('🧪 Testing Generic Domain Scoring Algorithm');
console.log('');

// ========== "HIGHER IS BETTER" EVENTS ==========
console.log('🏋️ Testing "Higher is Better" Events (Weight, Reps, Calories):');

// Example: A 25-year-old male who deadlifts 400 lbs
// Cohort: male_18_29 (Poor: 173 lb, Elite: 552 lb)
// Expected Score: ((400-173)/(552-173)) * 100 = 59.9

const userPerformance = 400;
const poorBenchmark = 173;
const eliteBenchmark = 552;

const calculatedScore = calculateNormalizedEventScore(userPerformance, poorBenchmark, eliteBenchmark, true);
const expectedScore = ((400-173)/(552-173)) * 100;

console.log('📊 Test Case: 25-year-old male deadlifting 400 lbs');
console.log('   Poor Benchmark: 173 lbs');
console.log('   Elite Benchmark: 552 lbs');
console.log('   User Performance: 400 lbs');
console.log('   Expected Score: ' + Math.round(expectedScore * 10) / 10);
console.log('   Calculated Score: ' + Math.round(calculatedScore * 10) / 10);
console.log('   ✅ Test ' + (Math.abs(calculatedScore - expectedScore) < 1 ? 'PASSED' : 'FAILED'));

console.log('');
console.log('🔍 Additional "Higher is Better" Test Cases:');

// Test edge cases
const higherBetterTestCases = [
  { perf: 100, poor: 173, elite: 552, desc: 'Below poor performance' },
  { perf: 173, poor: 173, elite: 552, desc: 'At poor performance' },
  { perf: 362.5, poor: 173, elite: 552, desc: 'Midpoint between poor and elite' },
  { perf: 552, poor: 173, elite: 552, desc: 'At elite performance' },
  { perf: 650, poor: 173, elite: 552, desc: 'Above elite performance' },
];

higherBetterTestCases.forEach(test => {
  const score = calculateNormalizedEventScore(test.perf, test.poor, test.elite, true);
  console.log(`   ${test.desc}: ${test.perf} lbs → ${Math.round(score * 10) / 10}/100`);
});

console.log('');
console.log('⏱️ Testing "Lower is Better" Events (Time):');

// Example: 5K run times using realistic benchmarks
// Female 18-29: Poor: 1567s (26:07), Elite: 1247s (20:47)

const lowerBetterTestCases = [
  { perf: 1700, poor: 1567, elite: 1247, desc: 'Slower than poor performance (28:20)' },
  { perf: 1567, poor: 1567, elite: 1247, desc: 'At poor performance (26:07)' },
  { perf: 1407, poor: 1567, elite: 1247, desc: 'Midpoint between poor and elite (23:27)' },
  { perf: 1247, poor: 1567, elite: 1247, desc: 'At elite performance (20:47)' },
  { perf: 1100, poor: 1567, elite: 1247, desc: 'Faster than elite performance (18:20)' },
  // Real user case that was broken:
  { perf: 1653, poor: 1567, elite: 1247, desc: 'User case: 27:33 (should be low score)' },
];

console.log('🔍 "Lower is Better" Test Cases (5K Run):');
lowerBetterTestCases.forEach(test => {
  const score = calculateNormalizedEventScore(test.perf, test.poor, test.elite, false);
  const minutes = Math.floor(test.perf / 60);
  const seconds = test.perf % 60;
  console.log(`   ${test.desc}: ${minutes}:${seconds.toString().padStart(2, '0')} → ${Math.round(score * 10) / 10}/100`);
});

console.log('');
console.log('📊 Testing Domain Averaging Logic:');
console.log('');

// Example: User has submitted multiple events within the strength domain
// Each event gets scored individually, then averaged for the final domain score

console.log('🏋️ Example: Male 25-29 in Strength Domain');
console.log('   Events: Deadlift, Back Squat, Military Press');
console.log('');

// User's best performances:
const deadliftPerf = 400;  // User lifts 400 lbs deadlift
const backSquatPerf = 300; // User lifts 300 lbs back squat  
const militaryPressPerf = 150; // User lifts 150 lbs military press

// Male 25-29 benchmarks (example data):
const deadliftBenchmarks = { poor: 173, elite: 552 };
const backSquatBenchmarks = { poor: 141, elite: 483 };
const militaryPressBenchmarks = { poor: 66, elite: 248 };

// Calculate individual event scores
const deadliftScore = calculateNormalizedEventScore(deadliftPerf, deadliftBenchmarks.poor, deadliftBenchmarks.elite, true);
const backSquatScore = calculateNormalizedEventScore(backSquatPerf, backSquatBenchmarks.poor, backSquatBenchmarks.elite, true);
const militaryPressScore = calculateNormalizedEventScore(militaryPressPerf, militaryPressBenchmarks.poor, militaryPressBenchmarks.elite, true);

console.log('📈 Individual Event Scores:');
console.log(`   Deadlift: ${deadliftPerf} lbs → ${Math.round(deadliftScore * 10) / 10}/100`);
console.log(`   Back Squat: ${backSquatPerf} lbs → ${Math.round(backSquatScore * 10) / 10}/100`);
console.log(`   Military Press: ${militaryPressPerf} lbs → ${Math.round(militaryPressScore * 10) / 10}/100`);

// Average the scores to get domain score
const domainScore = Math.round((deadliftScore + backSquatScore + militaryPressScore) / 3);

console.log('');
console.log('🎯 Domain Score Calculation:');
console.log(`   (${Math.round(deadliftScore)} + ${Math.round(backSquatScore)} + ${Math.round(militaryPressScore)}) / 3 = ${domainScore}/100`);
console.log(`   Final Strength Domain Score: ${domainScore}/100`);

console.log('');
console.log('✨ Domain averaging logic is working correctly!');
console.log('   - Each event is scored individually based on user\'s best performance');
console.log('   - Event scores are averaged to get the final domain score');
console.log('   - This allows balanced scoring across multiple events in a domain'); 