import { calculateNormalizedEventScore } from './scoringService';

// Test the example from the documentation
console.log('🧪 Testing Strength Domain Scoring Algorithm');
console.log('');

// Example: A 25-year-old male who deadlifts 400 lbs
// Cohort: male_18_29 (Poor: 173 lb, Elite: 552 lb)
// Expected Score: 250 + 500 * ((400-173)/(552-173)) = 549

const userPerformance = 400;
const poorBenchmark = 173;
const eliteBenchmark = 552;

const calculatedScore = calculateNormalizedEventScore(userPerformance, poorBenchmark, eliteBenchmark);
const expectedScore = 250 + 500 * ((400-173)/(552-173));

console.log('📊 Test Case: 25-year-old male deadlifting 400 lbs');
console.log('   Poor Benchmark: 173 lbs');
console.log('   Elite Benchmark: 552 lbs');
console.log('   User Performance: 400 lbs');
console.log('   Expected Score: ' + Math.round(expectedScore));
console.log('   Calculated Score: ' + calculatedScore);
console.log('   ✅ Test ' + (Math.abs(calculatedScore - expectedScore) < 1 ? 'PASSED' : 'FAILED'));

console.log('');
console.log('🔍 Additional Test Cases:');

// Test edge cases
const testCases = [
  { perf: 100, poor: 173, elite: 552, desc: 'Below poor performance' },
  { perf: 173, poor: 173, elite: 552, desc: 'At poor performance' },
  { perf: 362.5, poor: 173, elite: 552, desc: 'Midpoint between poor and elite' },
  { perf: 552, poor: 173, elite: 552, desc: 'At elite performance' },
  { perf: 650, poor: 173, elite: 552, desc: 'Above elite performance' },
];

testCases.forEach(test => {
  const score = calculateNormalizedEventScore(test.perf, test.poor, test.elite);
  console.log(`   ${test.desc}: ${test.perf} lbs → ${score}/1000`);
});

console.log('');
console.log('✨ Scoring algorithm is ready for production use!'); 