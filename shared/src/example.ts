import { tacticalRegistry } from './registry/tactical.registry';
import { TacticalCategory, ComplexityLevel } from './enums/tactical.enums';
import { GraniteResponseSchema } from './schemas/tactical.schemas';
import { TacticalConcept } from './types/tactical';

console.log('\n======================================================');
console.log('⚽ FOOTBALL ATLAS KNOWLEDGE DOMAIN ARCHITECTURE TESTING');
console.log('======================================================\n');

// 1. Test Registry Lookup
console.log('1. Testing registry lookup for "false_9"...');
const false9 = tacticalRegistry.getConcept('false_9');
if (false9) {
  console.log(`   ✅ Success! Retrieved: "${false9.concept_name}"`);
  console.log(`   - Category: ${false9.category}`);
  console.log(`   - Complexity: ${false9.complexity}`);
  console.log(`   - Core explanation: "${false9.core_explanation.slice(0, 110)}..."`);
  console.log(`   - Schema Version: ${false9.schema_version}`);
} else {
  console.error('   ❌ Error: Failed to retrieve "false_9" concept.');
}
console.log();

// 2. Query Category list
console.log('2. Querying concepts in the "PRESSING" category...');
const pressingPlays = tacticalRegistry.getConceptsByCategory(TacticalCategory.PRESSING);
console.log(`   ✅ Success! Found ${pressingPlays.length} pressing play(s) in registry:`);
pressingPlays.forEach(c => {
  console.log(`   - ${c.concept_name} (Complexity: ${c.complexity})`);
});
console.log();

// 3. Test Graph Link Resolution
console.log('3. Resolving related concepts graph links for "pressing_trap"...');
const related = tacticalRegistry.getRelatedConcepts('pressing_trap');
console.log(`   ✅ Success! Found ${related.length} resolved linked concept(s):`);
related.forEach(c => {
  console.log(`   - ${c.concept_name} (ID: ${c.concept_id}, Category: ${c.category})`);
});
console.log();

// 4. Test Granite Output Contract Validation
console.log('4. Validating sample IBM Granite AI tutor response envelope...');
const sampleGraniteOutput = {
  concept_id: 'false_9',
  confidence_score: 95.8,
  explanation: 'Lionel Messi dropped deep as a False 9, overloading central midfield and dragging Madrid centerbacks Metzelder and Cannavaro out of structure.',
  recommended_animation: 'false9',
  follow_up_concepts: ['third_man_run', 'midfield_overload']
};

const graniteResult = GraniteResponseSchema.safeParse(sampleGraniteOutput);
if (graniteResult.success) {
  console.log('   ✅ Success! Granite response schema conforms to contract guidelines:');
  console.log(`   - Mapped Concept ID: ${graniteResult.data.concept_id}`);
  console.log(`   - Confidence Score: ${graniteResult.data.confidence_score}%`);
  console.log(`   - Animation Module: ${graniteResult.data.recommended_animation}`);
} else {
  console.error('   ❌ Error: Granite response schema validation failed:');
  console.error(JSON.stringify(graniteResult.error.format(), null, 2));
}
console.log();

// 5. Test Schema Error Rejection
console.log('5. Triggering schema validation checks with a malformed concept body...');
const malformedConcept: any = {
  concept_id: 'bad_concept',
  concept_name: 'Broken Play',
  category: 'NOT_A_VALID_CATEGORY', // Should fail enum checks
  complexity: ComplexityLevel.BEGINNER,
  core_explanation: 'Short', // Should fail min length of 20
  key_principles: [], // Should fail non-empty array checks
  schema_version: '1.0', // Should fail semver checks (needs major.minor.patch)
  created_at: '2026-05-31', // Should fail ISO string validation
  updated_at: '2026-05-31T00:00:00Z'
};

try {
  tacticalRegistry.registerConcept(malformedConcept as TacticalConcept);
  console.error('   ❌ Test Failed: Registry accepted malformed concept schema.');
} catch (err: any) {
  console.log('   ✅ Success! Registry blocked registration and threw validation checks:');
  console.log(`   - Error Message: ${err.message}`);
}

console.log('\n======================================================');
console.log('⚽ ALL KNOWLEDGE DOMAIN VERIFICATIONS COMPLETED');
console.log('======================================================\n');
