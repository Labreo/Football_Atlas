import { groundedExampleService } from './services/groundedExample.service';
import { GraniteService } from './services/granite.service';
import { knowledgeStore } from './services/store.service';
import { documentIngestionService } from './services/ingestion.service';
import { ComplexityLevel } from '@football-atlas/shared';

async function runVerification() {
  console.log('⚽ Football Atlas Grounded Intelligence Layer Verification...\n');

  // Test 1: Seed verification data if store is empty
  const allChunks = knowledgeStore.getAllChunks();
  console.log(`[Test 1] Current database document chunks: ${allChunks.length}`);
  if (allChunks.length === 0) {
    console.log('📥 Knowledge store is empty. Ingesting tactical document using documentIngestionService...');
    
    const articleContent = `
# The False 9 and Midfield Overloads under Guardiola
Author: Sanjay Waradkar
Source: Football Atlas Tactical In-Depth
Published: 2024

In modern positional play, occupying the half-spaces and manipulating defensive structures is paramount. Under Pep Guardiola, the False 9 became the ultimate spatial weapon. 

# Section 1: The Striker Dropping Deep
By deploying Lionel Messi centrally but instructing him to drop deep into midfield, Barcelona turned standard 3v3 midfield battles into a 4v3 midfield overload in their 2009 Champions League Final performance. Barcelona vs Manchester United (2009).
The central defenders of Real Madrid were faced with a dilemma: step up to follow the False 9 and leave massive wide channels, or stay flat and allow Messi time to turn and play passing lanes.
This numerical superiority allowed clean progression through central corridors.

# Section 2: Inverted Wingers and Exploitation
As Messi dropped to receive, inverted wingers Thierry Henry and Samuel Eto'o made diagonal runs from out to in, penetrating the space vacated by the center-backs. 
This third man run pattern was triggered instantly when the center-back stepped forward. The movement forced defenders to track runs horizontally, breaking the defensive line.
`;

    const file = {
      buffer: Buffer.from(articleContent, 'utf-8'),
      originalname: 'tactical_analysis_guardiola.md',
      mimetype: 'text/markdown'
    };

    const metadata = {
      title: 'The False 9 and Midfield Overloads under Guardiola',
      source: 'Football Atlas Tactical In-Depth',
      author: 'Sanjay Waradkar',
      publication_year: 2024
    };

    await documentIngestionService.ingestDocument(file as any, metadata);
    console.log(`✅ Ingested and indexed tactical document successfully. Chunks now: ${knowledgeStore.getAllChunks().length}`);
  }

  // Test 2: Evidence retrieval SLA latency check (<300ms)
  console.log('\n[Test 2] Performance Audit: Grounded evidence retrieval SLA (<300ms)...');
  const exampleId = 'barcelona_2009_f9';
  const startRetrieve = performance.now();
  
  // Warm up
  const evidenceWarmup = groundedExampleService.getEvidenceForExample(exampleId);
  
  // Timing loop
  const iterations = 100;
  const timings: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const iterStart = performance.now();
    groundedExampleService.getEvidenceForExample(exampleId);
    timings.push(performance.now() - iterStart);
  }
  
  const retrieveEnd = performance.now();
  const averageLatency = timings.reduce((a, b) => a + b, 0) / iterations;
  console.log(` - Average Evidence Retrieval Latency: ${averageLatency.toFixed(3)}ms`);
  
  if (averageLatency > 300) {
    throw new Error(`Evidence retrieval latency failed SLA: average latency was ${averageLatency.toFixed(3)}ms (Threshold: <300ms)`);
  }
  console.log(' ✅ SLA Latency Check passed! (<300ms)');

  // Test 3: Structural Integrity of Evidence Record
  console.log('\n[Test 3] Verifying Grounded Evidence Record Model Structure...');
  const evidence = groundedExampleService.getEvidenceForExample(exampleId);
  if (evidence.length === 0) {
    throw new Error(`No evidence found for example "${exampleId}"`);
  }

  const primaryEvidence = evidence[0];
  console.log(` - Checked evidence ID: ${primaryEvidence.evidence_id}`);
  console.log(` - Document Title: ${primaryEvidence.source_title}`);
  console.log(` - Document Type: ${primaryEvidence.source_type}`);
  console.log(` - Confidence Rating: ${Math.round(primaryEvidence.confidence * 100)}%`);
  console.log(` - Excerpt snippet: "${primaryEvidence.excerpt.substring(0, 80)}..."`);

  if (!primaryEvidence.evidence_id || !primaryEvidence.document_id || !primaryEvidence.chunk_id || !primaryEvidence.excerpt) {
    throw new Error('Structural validation failed: Missing required fields in HistoricalEvidence schema.');
  }
  console.log(' ✅ Evidence schema verified successfully!');

  // Test 4: Granite Grounding and Source Follow-ups
  console.log('\n[Test 4] Verifying source follow-up classifier in Granite Service...');
  const granite = new GraniteService();

  const questions = [
    'Where did you get that?',
    'What source says that?',
    'Show supporting evidence.',
    'Where does this analysis come from?'
  ];

  for (const q of questions) {
    const startQ = performance.now();
    const result = await granite.queryTutor(q, 'test-verification-session');
    const duration = performance.now() - startQ;

    console.log(` - Question: "${q}" | Response generated in ${duration.toFixed(2)}ms`);
    
    if (duration > 3000) {
      throw new Error(`Granite source follow-up response latency failed SLA: ${duration.toFixed(2)}ms (Threshold: <3000ms)`);
    }

    if (!result.success || !result.data) {
      throw new Error(`Granite query returned failure status for question: "${q}"`);
    }

    const resData: any = result.data;
    if (resData.needs_clarification) {
      throw new Error(`Granite incorrectly requested clarification for a direct source follow-up: "${q}"`);
    }

    if (!resData.explanation || resData.explanation.length === 0) {
      throw new Error(`Granite returned empty explanation for follow-up: "${q}"`);
    }

    // Verify Action cards for source mapping exist
    const actions = resData.actions || [];
    const hasViewSource = actions.some((act: any) => act.type === 'VIEW_SOURCE');
    const hasOpenEvidence = actions.some((act: any) => act.type === 'OPEN_EVIDENCE');

    console.log(`   * Actions generated: ${actions.map((a: any) => a.type).join(', ')}`);
    if (!hasViewSource || !hasOpenEvidence) {
      throw new Error(`Granite follow-up did not attach VIEW_SOURCE and OPEN_EVIDENCE action cards.`);
    }
  }

  console.log(' ✅ Source follow-up classification and SLA timing passed! (<3s)');

  // Test 5: Verify Grounding is injected into explanations
  console.log('\n[Test 5] Verifying grounded example generation...');
  const f9ExampleQuery = 'Show me a real example of a False 9';
  const startF9 = performance.now();
  const f9Result = await granite.queryTutor(f9ExampleQuery, 'test-verification-session');
  const durationF9 = performance.now() - startF9;

  console.log(` - Example query: "${f9ExampleQuery}" | Generated in ${durationF9.toFixed(2)}ms`);
  const f9Data: any = f9Result.data;
  
  if (!f9Data.explanation || !f9Data.explanation.includes('Barcelona')) {
    throw new Error('Explanation did not correctly reference Pep Guardiola\'s Barcelona example.');
  }

  const actionsF9 = f9Data.actions || [];
  const hasLaunchBreakdown = actionsF9.some((a: any) => a.type === 'LAUNCH_HISTORICAL_BREAKDOWN');
  
  if (!hasLaunchBreakdown) {
    throw new Error('Explanation actions did not include a LAUNCH_HISTORICAL_BREAKDOWN action card.');
  }
  
  console.log(' ✅ Grounded example generation and action dispatching verified.');

  console.log('\n🎉 ALL GROUNDED HISTORICAL INTELLIGENCE LAYER CHECKS PASSED!');
}

runVerification().catch(err => {
  console.error('\n❌ Verification Failed:', err);
  process.exit(1);
});
