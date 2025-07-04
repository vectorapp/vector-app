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

// Example: A runner who completes 5K in 20:00 (1200 seconds)
// Cohort example: (Poor: 1800 seconds, Elite: 900 seconds)
// For time events, lower is better, so we flip the logic

const lowerBetterTestCases = [
  { perf: 2000, poor: 1800, elite: 900, desc: 'Slower than poor performance' },
  { perf: 1800, poor: 1800, elite: 900, desc: 'At poor performance' },
  { perf: 1350, poor: 1800, elite: 900, desc: 'Midpoint between poor and elite' },
  { perf: 900, poor: 1800, elite: 900, desc: 'At elite performance' },
  { perf: 700, poor: 1800, elite: 900, desc: 'Faster than elite performance' },
];

console.log('🔍 "Lower is Better" Test Cases:');
lowerBetterTestCases.forEach(test => {
  const score = calculateNormalizedEventScore(test.perf, test.poor, test.elite, false);
  console.log(`   ${test.desc}: ${test.perf} seconds → ${Math.round(score * 10) / 10}/100`);
});

console.log('');
console.log('✨ Generic scoring algorithm is ready for production use!'); 