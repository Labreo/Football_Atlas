import { historicalExampleRepository } from './repositories/historicalExample.repository';
import { historicalExampleService } from './services/historicalExample.service';
import { historicalExplanationGenerator } from './services/historicalExplanation.generator';
import { ComplexityLevel } from '@football-atlas/shared';

async function runVerification() {
  console.log('🧪 Starting rigorous quality control verification for 78 historical examples...');

  // Test 1: Ingestion & Repository Load
  const allExamples = historicalExampleRepository.getAll();
  console.log(`[Test 1] Loaded examples from repository: ${allExamples.length}`);
  if (allExamples.length !== 78) {
    throw new Error(`Expected exactly 78 historical examples, but loaded ${allExamples.length}`);
  }

  // Test 2: Duplicate ID check
  const ids = allExamples.map(ex => ex.example_id);
  const uniqueIds = new Set(ids);
  if (uniqueIds.size !== 78) {
    throw new Error(`Duplicate example IDs detected. Unique count: ${uniqueIds.size}`);
  }
  console.log('[Test 2] No duplicate example IDs found.');

  // Test 3: Concept Coverage
  // Original 10 concepts: exactly 5 per concept
  const originalConcepts = [
    'false_9',
    'high_press',
    'defensive_block',
    'pressing_trap',
    'midfield_overload',
    'counter_attack_trigger',
    'inverted_winger',
    'back_three_wing_back',
    'third_man_run',
    'compactness_pressing_lines'
  ];

  // New 14 concepts: exactly 2 per concept
  const newConcepts = [
    'gegenpressing',
    'rest_defense',
    'positional_play',
    'box_midfield',
    'overlapping_runs',
    'overloading_to_isolate',
    'half_space_exploitation',
    'vertical_tiki_taka',
    'shadow_striker',
    'pressing_triggers',
    'midfield_rotation',
    'sweeper_keeper',
    'defensive_transitions',
    'inverted_fullbacks'
  ];

  console.log('[Test 3] Auditing concept coverage details:');
  for (const conceptId of originalConcepts) {
    const conceptExamples = historicalExampleRepository.getByConcept(conceptId);
    console.log(` - Concept "${conceptId}": ${conceptExamples.length} examples`);
    if (conceptExamples.length !== 5) {
      throw new Error(`Concept "${conceptId}" must have exactly 5 examples, found ${conceptExamples.length}`);
    }
  }

  for (const conceptId of newConcepts) {
    const conceptExamples = historicalExampleRepository.getByConcept(conceptId);
    console.log(` - Concept "${conceptId}": ${conceptExamples.length} examples`);
    if (conceptExamples.length !== 2) {
      throw new Error(`Concept "${conceptId}" must have exactly 2 examples, found ${conceptExamples.length}`);
    }
  }

  // Test 4: Search filters verification
  console.log('[Test 4] Verifying search indexes...');
  const pepMatches = historicalExampleService.getExamplesByCoach('Pep Guardiola');
  console.log(` - Pep Guardiola matches: ${pepMatches.length}`);
  if (pepMatches.length < 5) {
    throw new Error(`Expected at least 5 matches for Guardiola, found ${pepMatches.length}`);
  }

  const kloopMatches = historicalExampleService.getExamplesByCoach('Klopp');
  console.log(` - Klopp matches: ${kloopMatches.length}`);
  if (kloopMatches.length < 3) {
    throw new Error(`Expected at least 3 matches for Klopp, found ${kloopMatches.length}`);
  }

  const messiMatches = historicalExampleService.getExamplesByPlayer('Messi');
  console.log(` - Messi matches: ${messiMatches.length}`);
  if (messiMatches.length < 3) {
    throw new Error(`Expected at least 3 matches for Messi, found ${messiMatches.length}`);
  }

  // Test 5: Complexity Ranking & Session Exclusions
  console.log('[Test 5] Verifying complexity scoring and session exclusion...');
  
  // false_9 - Beginner
  const bestBeginnerFalse9 = historicalExampleService.getBestExample('false_9', ComplexityLevel.BEGINNER, []);
  console.log(` - Best Beginner False 9: "${bestBeginnerFalse9?.match_name}"`);
  if (!bestBeginnerFalse9?.beginner_friendly) {
    throw new Error('Best beginner example must have beginner_friendly=true');
  }

  // false_9 - Advanced
  const bestAdvancedFalse9 = historicalExampleService.getBestExample('false_9', ComplexityLevel.ADVANCED, []);
  console.log(` - Best Advanced False 9: "${bestAdvancedFalse9?.match_name}"`);
  if (bestAdvancedFalse9?.beginner_friendly) {
    throw new Error('Best advanced example must have beginner_friendly=false');
  }

  // Exclude first 2 and get next
  const history = ['barcelona_2009_f9', 'barca_clasico_2009_f9'];
  const nextFalse9 = historicalExampleService.getBestExample('false_9', ComplexityLevel.BEGINNER, history);
  console.log(` - Next False 9 after exclusions: "${nextFalse9?.match_name}"`);
  if (history.includes(nextFalse9!.example_id)) {
    throw new Error('Session exclusion failed: served duplicate example.');
  }

  // Test 6: Fallback explanation formatting
  console.log('[Test 6] Verifying text generation templates...');
  const explanation = await historicalExplanationGenerator.generateExplanation(
    bestBeginnerFalse9!,
    'False 9',
    'Tell me a real example'
  );
  if (!explanation.includes('Pep Guardiola') || !explanation.includes('Lionel Messi')) {
    throw new Error('Generated text did not contain required entities.');
  }
  console.log(' - Text formatting looks correct.');

  console.log('\n✅ All quality control and schema checks passed successfully! 78/78 examples verified.');
}

runVerification().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
