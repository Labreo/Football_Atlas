import { historicalExampleRepository } from './repositories/historicalExample.repository';
import { historicalExampleService } from './services/historicalExample.service';
import { historicalExplanationGenerator } from './services/historicalExplanation.generator';
import { ComplexityLevel } from '@football-atlas/shared';

async function runVerification() {
  console.log('🧪 Starting Historical Match Knowledge System verification tests...');

  // Test 1: Ingestion & Repository Load
  const allExamples = historicalExampleRepository.getAll();
  console.log(`[Test 1] Loaded examples from repository: ${allExamples.length}`);
  if (allExamples.length === 0) {
    throw new Error('No historical examples loaded from data store.');
  }

  // Test 2: Filter by Concept ID
  const false9Examples = historicalExampleRepository.getByConcept('false_9');
  console.log(`[Test 2] False 9 examples found: ${false9Examples.length}`);
  if (false9Examples.length < 2) {
    throw new Error('Expected at least 2 historical examples for False 9 concept.');
  }

  // Test 3: Search queries
  const guardiolaMatches = historicalExampleService.getExamplesByCoach('Pep Guardiola');
  console.log(`[Test 3] Guardiola matches: ${guardiolaMatches.length}`);
  if (guardiolaMatches.length === 0) {
    throw new Error('Guardiola search filter failed to return matches.');
  }

  const messiMatches = historicalExampleService.getExamplesByPlayer('Messi');
  console.log(`[Test 3] Messi matches: ${messiMatches.length}`);
  if (messiMatches.length === 0) {
    throw new Error('Messi search filter failed.');
  }

  // Test 4: Ranking under Complexity Levels
  console.log('\n--- [Test 4] Verifying Complexity-based Ranking ---');
  
  // False 9 - Beginner
  const bestBeginnerFalse9 = historicalExampleService.getBestExample('false_9', ComplexityLevel.BEGINNER, []);
  console.log(`Best Beginner False 9: "${bestBeginnerFalse9?.match_name}" (Expected: Barcelona vs Manchester United (2009 UCL Final))`);
  if (bestBeginnerFalse9?.example_id !== 'barcelona_2009_f9') {
    throw new Error(`Unexpected beginner False 9: ${bestBeginnerFalse9?.example_id}`);
  }

  // False 9 - Advanced
  const bestAdvancedFalse9 = historicalExampleService.getBestExample('false_9', ComplexityLevel.ADVANCED, []);
  console.log(`Best Advanced False 9: "${bestAdvancedFalse9?.match_name}" (Expected: Spain vs Italy (Euro 2012 Final))`);
  if (bestAdvancedFalse9?.example_id !== 'spain_2012_f9') {
    throw new Error(`Unexpected advanced False 9: ${bestAdvancedFalse9?.example_id}`);
  }

  // Test 5: Session Exclusion ("Give me another example")
  console.log('\n--- [Test 5] Verifying Session Exclusion ---');
  const sessionHistory = [bestBeginnerFalse9!.example_id];
  const nextFalse9 = historicalExampleService.getBestExample('false_9', ComplexityLevel.BEGINNER, sessionHistory);
  console.log(`Next False 9 after excluding Barcelona 2009: "${nextFalse9?.match_name}" (Expected: Spain vs Italy (Euro 2012 Final))`);
  if (nextFalse9?.example_id !== 'spain_2012_f9') {
    throw new Error(`Exclusion failed. Expected Spain 2012 but got: ${nextFalse9?.example_id}`);
  }

  // Test 6: Explanation Generation
  console.log('\n--- [Test 6] Verifying Explanation Generator Fallback ---');
  const explanation = await historicalExplanationGenerator.generateExplanation(
    bestBeginnerFalse9!,
    'False 9',
    'Explain the False 9 real example'
  );
  console.log('Explanation output:');
  console.log(explanation);
  
  if (!explanation.includes('Pep Guardiola') || !explanation.includes('Lionel Messi') || !explanation.includes('Samuel Eto\'o')) {
    throw new Error('Generated explanation doesn\'t contain required player or coach references.');
  }

  console.log('\n✅ All Historical Match Knowledge System verification tests passed successfully!');
}

runVerification().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
