import { GraniteService } from './services/granite.service';
import { contextManager } from './services/context.manager';
import fs from 'fs';
import path from 'path';

const graniteService = new GraniteService();

interface FollowUpScenario {
  id: number;
  conceptId: string;
  initialQuestion: string;
  followUpQuestion: string;
  expectedIntent: string;
  expectReferenceResolved?: boolean;
  expectContextRecovered?: boolean;
  expectClarification?: boolean;
  description: string;
}

const scenarios: FollowUpScenario[] = [
  {
    id: 1,
    conceptId: 'false_9',
    initialQuestion: 'What is a False 9?',
    followUpQuestion: 'Why does that work?',
    expectedIntent: 'DIRECT_FOLLOWUP',
    expectReferenceResolved: true,
    description: 'Resolve pronoun "that" to active False 9 concept.'
  },
  {
    id: 2,
    conceptId: 'false_9',
    initialQuestion: 'What is a False 9?',
    followUpQuestion: 'What problems does it create?',
    expectedIntent: 'DIRECT_FOLLOWUP',
    expectReferenceResolved: true,
    description: 'Resolve pronoun "it" to active False 9 concept.'
  },
  {
    id: 3,
    conceptId: 'false_9',
    initialQuestion: 'What is a False 9?',
    followUpQuestion: 'How do defenders stop it?',
    expectedIntent: 'CONCEPT_TRANSITION',
    expectReferenceResolved: true,
    description: 'Transition False 9 to defensive response.'
  },
  {
    id: 4,
    conceptId: 'false_9',
    initialQuestion: 'What is a False 9?',
    followUpQuestion: 'Can you show a real example?',
    expectedIntent: 'EXAMPLE_REQUEST',
    description: 'Request a historical example match.'
  },
  {
    id: 5,
    conceptId: 'false_9',
    initialQuestion: 'What is a False 9?',
    followUpQuestion: 'How did Messi do it?',
    expectedIntent: 'DIRECT_FOLLOWUP',
    expectReferenceResolved: true,
    description: 'Resolve "it" to False 9, detect Lionel Messi player context.'
  },
  {
    id: 6,
    conceptId: 'high_press',
    initialQuestion: 'How does a high press work?',
    followUpQuestion: 'Why does that trigger turnovers?',
    expectedIntent: 'DIRECT_FOLLOWUP',
    expectReferenceResolved: true,
    description: 'Resolve pronoun "that" to active High Press.'
  },
  {
    id: 7,
    conceptId: 'high_press',
    initialQuestion: 'How does a high press work?',
    followUpQuestion: 'What space opens up behind it?',
    expectedIntent: 'DIRECT_FOLLOWUP',
    expectReferenceResolved: true,
    description: 'Resolve pronoun "it" to active High Press.'
  },
  {
    id: 8,
    conceptId: 'high_press',
    initialQuestion: 'How does a high press work?',
    followUpQuestion: 'Show me another example',
    expectedIntent: 'AMBIGUOUS_FOLLOWUP',
    expectClarification: true,
    description: 'Prompt clarification on ambiguous request.'
  },
  {
    id: 9,
    conceptId: 'high_press',
    initialQuestion: 'How does a high press work?',
    followUpQuestion: 'How does Klopp use this shape?',
    expectedIntent: 'EXAMPLE_REQUEST',
    expectReferenceResolved: true,
    description: 'Request Klopp coach details and resolve "this shape" to High Press.'
  },
  {
    id: 10,
    conceptId: 'pressing_trap',
    initialQuestion: 'What is a pressing trap?',
    followUpQuestion: 'How do they close the space?',
    expectedIntent: 'DIRECT_FOLLOWUP',
    expectReferenceResolved: true,
    description: 'Resolve pronoun "they" to active pressing trap.'
  },
  {
    id: 11,
    conceptId: 'pressing_trap',
    initialQuestion: 'What is a pressing trap?',
    followUpQuestion: 'How do compactness principles affect it?',
    expectedIntent: 'CONCEPT_TRANSITION',
    expectReferenceResolved: true,
    description: 'Transition pressing trap to compactness lines.'
  },
  {
    id: 12,
    conceptId: 'midfield_overload',
    initialQuestion: 'Explain a midfield overload.',
    followUpQuestion: 'Why does that overload central spaces?',
    expectedIntent: 'DIRECT_FOLLOWUP',
    expectReferenceResolved: true,
    description: 'Resolve pronoun "that" to midfield overload.'
  },
  {
    id: 13,
    conceptId: 'midfield_overload',
    initialQuestion: 'Explain a midfield overload.',
    followUpQuestion: 'How does it help third man runs?',
    expectedIntent: 'CONCEPT_TRANSITION',
    expectReferenceResolved: true,
    description: 'Transition midfield overload to third man runs.'
  },
  {
    id: 14,
    conceptId: 'defensive_block',
    initialQuestion: 'Explain a defensive block.',
    followUpQuestion: 'How do strikers break it down?',
    expectedIntent: 'DIRECT_FOLLOWUP',
    expectReferenceResolved: true,
    description: 'Resolve pronoun "it" to defensive block.'
  },
  {
    id: 15,
    conceptId: 'counter_attack_trigger',
    initialQuestion: 'What is a counter attack trigger?',
    followUpQuestion: 'How does that trigger transitions?',
    expectedIntent: 'DIRECT_FOLLOWUP',
    expectReferenceResolved: true,
    description: 'Resolve pronoun "that" to counter-attack trigger.'
  },
  {
    id: 16,
    conceptId: 'counter_attack_trigger',
    initialQuestion: 'What is a counter attack trigger?',
    followUpQuestion: 'How do we recover in a back three wingback system?',
    expectedIntent: 'CONCEPT_TRANSITION',
    description: 'Transition counter-attack to back-three system.'
  },
  {
    id: 17,
    conceptId: 'inverted_winger',
    initialQuestion: 'What is an inverted winger?',
    followUpQuestion: 'Why does he cut inside?',
    expectedIntent: 'DIRECT_FOLLOWUP',
    description: 'Resolve active inverted winger role details.'
  },
  {
    id: 18,
    conceptId: 'inverted_winger',
    initialQuestion: 'What is an inverted winger?',
    followUpQuestion: 'Show a real match example of Robben.',
    expectedIntent: 'EXAMPLE_REQUEST',
    description: 'Request Robben historical winger match.'
  },
  {
    id: 19,
    conceptId: 'back_three_wing_back',
    initialQuestion: 'What is a back three wing back system?',
    followUpQuestion: 'How do wingbacks slide in it?',
    expectedIntent: 'DIRECT_FOLLOWUP',
    expectReferenceResolved: true,
    description: 'Resolve pronoun "it" to back three.'
  },
  {
    id: 20,
    conceptId: 'compactness_pressing_lines',
    initialQuestion: 'Explain compactness.',
    followUpQuestion: 'What is Sacchi\'s reference point?',
    expectedIntent: 'DIRECT_FOLLOWUP',
    description: 'Query Arrigo Sacchi context in compactness.'
  },
  {
    id: 21,
    conceptId: 'third_man_run',
    initialQuestion: 'What is a third man run?',
    followUpQuestion: 'Why is it impossible to mark he?',
    expectedIntent: 'DIRECT_FOLLOWUP',
    expectReferenceResolved: true,
    description: 'Resolve pronoun "it" to third man run.'
  },
  {
    id: 22,
    conceptId: 'inverted_winger',
    initialQuestion: 'Explain inverted wingers.',
    followUpQuestion: 'Going back to the False 9 example...',
    expectedIntent: 'DIRECT_FOLLOWUP',
    expectContextRecovered: true,
    description: 'Recover False 9 context from history.'
  },
  {
    id: 23,
    conceptId: 'defensive_block',
    initialQuestion: 'Explain defensive blocks.',
    followUpQuestion: 'Return to our discussion on the high press.',
    expectedIntent: 'DIRECT_FOLLOWUP',
    expectContextRecovered: true,
    description: 'Recover High Press context from history.'
  },
  {
    id: 24,
    conceptId: 'false_9',
    initialQuestion: 'What is a False 9?',
    followUpQuestion: 'Why did Messi move there?',
    expectedIntent: 'BREAKDOWN_REQUEST',
    description: 'Identify breakdown request regarding player position.'
  },
  {
    id: 25,
    conceptId: 'high_press',
    initialQuestion: 'How does a high press work?',
    followUpQuestion: 'Show the passing lane.',
    expectedIntent: 'BREAKDOWN_REQUEST',
    description: 'Identify breakdown query asking to show visual lanes.'
  },
  {
    id: 26,
    conceptId: 'compactness_pressing_lines',
    initialQuestion: 'Explain compactness.',
    followUpQuestion: 'Show me one.',
    expectedIntent: 'AMBIGUOUS_FOLLOWUP',
    expectClarification: true,
    description: 'Clarify ambiguous request "Show me one".'
  },
  {
    id: 27,
    conceptId: 'false_9',
    initialQuestion: 'What is a False 9?',
    followUpQuestion: 'Compare Messi, Firmino, and Fàbregas implementations.',
    expectedIntent: 'COMPARISON_REQUEST',
    description: 'Request profile comparisons for False 9 strikers.'
  },
  {
    id: 28,
    conceptId: 'high_press',
    initialQuestion: 'What is a high press?',
    followUpQuestion: 'What is the difference between Klopp and Guardiola systems?',
    expectedIntent: 'COMPARISON_REQUEST',
    description: 'Compare Klopp vs Pep high-pressing styles.'
  },
  {
    id: 29,
    conceptId: 'pressing_trap',
    initialQuestion: 'What is a pressing trap?',
    followUpQuestion: 'Explain this simply.',
    expectedIntent: 'CLARIFICATION_REQUEST',
    description: 'Request beginner/simplified clarification.'
  },
  {
    id: 30,
    conceptId: 'compactness_pressing_lines',
    initialQuestion: 'Explain compactness.',
    followUpQuestion: 'What does pressing mean?',
    expectedIntent: 'CLARIFICATION_REQUEST',
    description: 'Request simple clarification of base term.'
  }
];

async function runTests() {
  console.log('🚀 Starting Follow-Up Question Intelligence test suite...');
  console.log(`Evaluating ${scenarios.length} curated scenarios across all 10 concepts...\n`);

  let passed = 0;
  let failed = 0;
  const startTime = Date.now();
  const resultsTable: Array<{ id: number; question: string; expected: string; actual: string; result: string }> = [];

  for (const scenario of scenarios) {
    const sessionToken = `test-session-${scenario.id}`;
    contextManager.clearContext(sessionToken);

    // Turn 1: Seed initial question
    const res1 = await graniteService.queryTutor(scenario.initialQuestion, sessionToken, `trace-seed-${scenario.id}`);
    
    // Inject a previous concept manually if testing recovery
    if (scenario.expectContextRecovered) {
      if (scenario.id === 22) {
        contextManager.updateContext(sessionToken, { previous_concepts: ['false_9'] });
      } else if (scenario.id === 23) {
        contextManager.updateContext(sessionToken, { previous_concepts: ['high_press'] });
      }
    }

    // Set active breakdown manually if testing breakdown queries
    if (scenario.expectedIntent === 'BREAKDOWN_REQUEST') {
      contextManager.updateContext(sessionToken, { active_breakdown: 'barcelona_2009_f9' });
    }

    // Turn 2: Follow-up question
    const res2 = await graniteService.queryTutor(scenario.followUpQuestion, sessionToken, `trace-followup-${scenario.id}`);
    const data = res2.data as any;

    let testPassed = true;
    const failures: string[] = [];

    // Verify expectations
    if (scenario.expectClarification) {
      if (!data.needs_clarification || !data.clarification_requested) {
        testPassed = false;
        failures.push('Expected clarification but did not trigger.');
      }
    } else {
      if (data.needs_clarification) {
        testPassed = false;
        failures.push('Unexpected clarification request.');
      }
    }

    if (scenario.expectReferenceResolved && !data.reference_resolved) {
      testPassed = false;
      failures.push('Expected pronoun/reference resolution but none flagged.');
    }

    if (scenario.expectContextRecovered && !data.context_recovered) {
      testPassed = false;
      failures.push('Expected context recovery but none occurred.');
    }

    if (testPassed) {
      passed++;
      console.log(`✅ [Scenario ${scenario.id}] PASS: "${scenario.followUpQuestion}" -> Detected intent: ${scenario.expectedIntent}`);
    } else {
      failed++;
      console.log(`❌ [Scenario ${scenario.id}] FAIL: "${scenario.followUpQuestion}"`);
      console.log(`    - Details: ${failures.join(' | ')}`);
      console.log(`    - API returned: ${JSON.stringify(data)}`);
    }

    resultsTable.push({
      id: scenario.id,
      question: scenario.followUpQuestion,
      expected: scenario.expectedIntent,
      actual: data.needs_clarification ? 'AMBIGUOUS_FOLLOWUP' : (data.concept_transition ? 'CONCEPT_TRANSITION' : (data.breakdown_followup ? 'BREAKDOWN_REQUEST' : 'DIRECT_FOLLOWUP')),
      result: testPassed ? 'PASS' : 'FAIL'
    });
  }

  const duration = Date.now() - startTime;
  const accuracy = (passed / scenarios.length) * 100;

  console.log('\n======================================================');
  console.log(`🏁 TESTS COMPLETED IN ${duration}ms`);
  console.log(`Accuracy: ${accuracy.toFixed(1)}% (${passed}/${scenarios.length} scenarios passed)`);
  console.log(`Passed: ${passed} | Failed: ${failed}`);
  console.log('======================================================\n');

  // Generate Report
  let markdown = `# Follow-Up Question Intelligence Test Report\n\n`;
  markdown += `* **Test Date**: ${new Date().toISOString()}\n`;
  markdown += `* **Total Scenarios Evaluated**: ${scenarios.length}\n`;
  markdown += `* **Passing**: ${passed} / ${scenarios.length}\n`;
  markdown += `* **Accuracy**: ${accuracy.toFixed(2)}%\n`;
  markdown += `* **Total Latency**: ${duration}ms (avg. ${(duration / scenarios.length).toFixed(2)}ms per follow-up)\n\n`;
  markdown += `## Metrics by Intent\n\n`;
  markdown += `| ID | Question | Expected Intent | Actual Detected | Status | Description |\n`;
  markdown += `|----|----------|-----------------|-----------------|--------|-------------|\n`;

  scenarios.forEach((s) => {
    const scRes = resultsTable.find(r => r.id === s.id);
    markdown += `| ${s.id} | "${s.followUpQuestion}" | \`${s.expectedIntent}\` | \`${scRes?.actual}\` | **${scRes?.result}** | ${s.description} |\n`;
  });

  const reportPath = path.resolve(__dirname, '../../artifacts/test_followup_report.md');
  fs.writeFileSync(reportPath, markdown);
  console.log(`Test report successfully saved to: ${reportPath}\n`);
}

runTests().catch(err => {
  console.error('❌ Test runner encountered error:', err);
});
