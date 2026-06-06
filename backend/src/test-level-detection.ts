import { ComplexityLevel } from '@football-atlas/shared';
import { KnowledgeLevelDetector } from './services/knowledgeLevelDetector.service';
import * as fs from 'fs';
import * as path from 'path';

interface Scenario {
  conceptId: string;
  expectedLevel: ComplexityLevel;
  question: string;
}

const scenarios: Scenario[] = [
  // 1. False 9
  { conceptId: 'false_9', expectedLevel: ComplexityLevel.BEGINNER, question: "What is a False 9?" },
  { conceptId: 'false_9', expectedLevel: ComplexityLevel.BEGINNER, question: "Why does Messi drop deep?" },
  { conceptId: 'false_9', expectedLevel: ComplexityLevel.BEGINNER, question: "What does a dropping striker do?" },
  { conceptId: 'false_9', expectedLevel: ComplexityLevel.BEGINNER, question: "Explain the false nine role simply." },
  { conceptId: 'false_9', expectedLevel: ComplexityLevel.BEGINNER, question: "Why is the striker moving away from the goal?" },
  { conceptId: 'false_9', expectedLevel: ComplexityLevel.INTERMEDIATE, question: "Why does a False 9 create overloads?" },
  { conceptId: 'false_9', expectedLevel: ComplexityLevel.INTERMEDIATE, question: "How does a dropping striker affect the build-up?" },
  { conceptId: 'false_9', expectedLevel: ComplexityLevel.INTERMEDIATE, question: "What problems does a False 9 create in midfield?" },
  { conceptId: 'false_9', expectedLevel: ComplexityLevel.INTERMEDIATE, question: "How do you defend against a False 9?" },
  { conceptId: 'false_9', expectedLevel: ComplexityLevel.INTERMEDIATE, question: "What are the pros and cons of using a false 9?" },
  { conceptId: 'false_9', expectedLevel: ComplexityLevel.ADVANCED, question: "How does a False 9 manipulate center-back reference points during positional attacks?" },
  { conceptId: 'false_9', expectedLevel: ComplexityLevel.ADVANCED, question: "Explain how the False 9 destabilizes defensive reference points to create central superiority." },
  { conceptId: 'false_9', expectedLevel: ComplexityLevel.ADVANCED, question: "How does the False 9 function in structural positional play models to exploit half-spaces?" },
  { conceptId: 'false_9', expectedLevel: ComplexityLevel.ADVANCED, question: "What structural tradeoffs occur when employing a False 9 against a vertically compact low block?" },
  { conceptId: 'false_9', expectedLevel: ComplexityLevel.ADVANCED, question: "Compare the False 9 implementations of Messi, Firmino, and Fabregas in positional attacks." },

  // 2. High Press
  { conceptId: 'high_press', expectedLevel: ComplexityLevel.BEGINNER, question: "What does pressing mean?" },
  { conceptId: 'high_press', expectedLevel: ComplexityLevel.BEGINNER, question: "Why do players run at the goalkeeper?" },
  { conceptId: 'high_press', expectedLevel: ComplexityLevel.BEGINNER, question: "What is a high press?" },
  { conceptId: 'high_press', expectedLevel: ComplexityLevel.BEGINNER, question: "Why do teams defend high up the pitch?" },
  { conceptId: 'high_press', expectedLevel: ComplexityLevel.BEGINNER, question: "Can you explain pressing simply?" },
  { conceptId: 'high_press', expectedLevel: ComplexityLevel.INTERMEDIATE, question: "How does a high press affect build-up play?" },
  { conceptId: 'high_press', expectedLevel: ComplexityLevel.INTERMEDIATE, question: "What is the main advantage of a high press?" },
  { conceptId: 'high_press', expectedLevel: ComplexityLevel.INTERMEDIATE, question: "How do teams bypass a high press?" },
  { conceptId: 'high_press', expectedLevel: ComplexityLevel.INTERMEDIATE, question: "Who are famous teams using a high press?" },
  { conceptId: 'high_press', expectedLevel: ComplexityLevel.INTERMEDIATE, question: "What are the physical demands of high pressing?" },
  { conceptId: 'high_press', expectedLevel: ComplexityLevel.ADVANCED, question: "How do compactness principles affect pressing trap efficiency?" },
  { conceptId: 'high_press', expectedLevel: ComplexityLevel.ADVANCED, question: "Explain how a high press manipulates the opponent's build-up structures." },
  { conceptId: 'high_press', expectedLevel: ComplexityLevel.ADVANCED, question: "How does vertical compactness optimize pressing lines in high-block structures?" },
  { conceptId: 'high_press', expectedLevel: ComplexityLevel.ADVANCED, question: "What are the transitional rest-defense tradeoffs when committing to a high press?" },
  { conceptId: 'high_press', expectedLevel: ComplexityLevel.ADVANCED, question: "Analyze pressing triggers used to disrupt goalkeeper possession in build-up play." },

  // 3. Pressing Trap
  { conceptId: 'pressing_trap', expectedLevel: ComplexityLevel.BEGINNER, question: "What is a pressing trap?" },
  { conceptId: 'pressing_trap', expectedLevel: ComplexityLevel.BEGINNER, question: "How do you trap a player on the field?" },
  { conceptId: 'pressing_trap', expectedLevel: ComplexityLevel.BEGINNER, question: "Explain how defense traps work simply." },
  { conceptId: 'pressing_trap', expectedLevel: ComplexityLevel.BEGINNER, question: "Why is the defense letting the opponent pass there?" },
  { conceptId: 'pressing_trap', expectedLevel: ComplexityLevel.BEGINNER, question: "What does defensive trap mean?" },
  { conceptId: 'pressing_trap', expectedLevel: ComplexityLevel.INTERMEDIATE, question: "How do you set a pressing trap?" },
  { conceptId: 'pressing_trap', expectedLevel: ComplexityLevel.INTERMEDIATE, question: "What is the difference between pressing and a pressing trap?" },
  { conceptId: 'pressing_trap', expectedLevel: ComplexityLevel.INTERMEDIATE, question: "How do teams escape a pressing trap?" },
  { conceptId: 'pressing_trap', expectedLevel: ComplexityLevel.INTERMEDIATE, question: "What are pros and cons of pressing traps?" },
  { conceptId: 'pressing_trap', expectedLevel: ComplexityLevel.INTERMEDIATE, question: "Give me a real example of a pressing trap." },
  { conceptId: 'pressing_trap', expectedLevel: ComplexityLevel.ADVANCED, question: "How do compactness principles affect pressing trap efficiency in the defensive block?" },
  { conceptId: 'pressing_trap', expectedLevel: ComplexityLevel.ADVANCED, question: "Detail the structural mechanics of sideline pressing traps under Pep Guardiola." },
  { conceptId: 'pressing_trap', expectedLevel: ComplexityLevel.ADVANCED, question: "How do central pressing traps manipulate central midfielder reference coordinates?" },
  { conceptId: 'pressing_trap', expectedLevel: ComplexityLevel.ADVANCED, question: "Analyze the coordination of defensive triggers to secure deterministic turnovers." },
  { conceptId: 'pressing_trap', expectedLevel: ComplexityLevel.ADVANCED, question: "What are the structural vulnerabilities if a pressing trap is bypassed by a third-man run?" },

  // 4. Midfield Overload
  { conceptId: 'midfield_overload', expectedLevel: ComplexityLevel.BEGINNER, question: "What does overload mean in football?" },
  { conceptId: 'midfield_overload', expectedLevel: ComplexityLevel.BEGINNER, question: "Why do teams put more players in midfield?" },
  { conceptId: 'midfield_overload', expectedLevel: ComplexityLevel.BEGINNER, question: "Explain midfield overload simply." },
  { conceptId: 'midfield_overload', expectedLevel: ComplexityLevel.BEGINNER, question: "How do you get more players in the middle?" },
  { conceptId: 'midfield_overload', expectedLevel: ComplexityLevel.BEGINNER, question: "What is an overload in the middle?" },
  { conceptId: 'midfield_overload', expectedLevel: ComplexityLevel.INTERMEDIATE, question: "Why does a False 9 create overloads in midfield?" },
  { conceptId: 'midfield_overload', expectedLevel: ComplexityLevel.INTERMEDIATE, question: "How do teams create midfield overloads?" },
  { conceptId: 'midfield_overload', expectedLevel: ComplexityLevel.INTERMEDIATE, question: "How do you defend against a midfield overload?" },
  { conceptId: 'midfield_overload', expectedLevel: ComplexityLevel.INTERMEDIATE, question: "What are the pros and cons of midfield overloads?" },
  { conceptId: 'midfield_overload', expectedLevel: ComplexityLevel.INTERMEDIATE, question: "Who are famous coaches that use midfield overloads?" },
  { conceptId: 'midfield_overload', expectedLevel: ComplexityLevel.ADVANCED, question: "How do inverted fullbacks manipulate defensive blocks to create central superiority?" },
  { conceptId: 'midfield_overload', expectedLevel: ComplexityLevel.ADVANCED, question: "Analyze the structural overload in central midfield zone 14 during positional attacks." },
  { conceptId: 'midfield_overload', expectedLevel: ComplexityLevel.ADVANCED, question: "What is the relation between midfield overloads and third-man run execution?" },
  { conceptId: 'midfield_overload', expectedLevel: ComplexityLevel.ADVANCED, question: "Explain how numerical overloads disrupt positional play structures in transition phases." },
  { conceptId: 'midfield_overload', expectedLevel: ComplexityLevel.ADVANCED, question: "Analyze the structural tradeoffs of central overloads versus wide flank vulnerability." },

  // 5. Defensive Block
  { conceptId: 'defensive_block', expectedLevel: ComplexityLevel.BEGINNER, question: "What is a defensive block?" },
  { conceptId: 'defensive_block', expectedLevel: ComplexityLevel.BEGINNER, question: "What does defending deep mean?" },
  { conceptId: 'defensive_block', expectedLevel: ComplexityLevel.BEGINNER, question: "What is a low block?" },
  { conceptId: 'defensive_block', expectedLevel: ComplexityLevel.BEGINNER, question: "Explain defensive block simply." },
  { conceptId: 'defensive_block', expectedLevel: ComplexityLevel.BEGINNER, question: "Why is the defense staying close to their goal?" },
  { conceptId: 'defensive_block', expectedLevel: ComplexityLevel.INTERMEDIATE, question: "How do teams break down a defensive block?" },
  { conceptId: 'defensive_block', expectedLevel: ComplexityLevel.INTERMEDIATE, question: "What is the role of a defensive block in a 4-4-2 shape?" },
  { conceptId: 'defensive_block', expectedLevel: ComplexityLevel.INTERMEDIATE, question: "How do you organize a compact defensive block?" },
  { conceptId: 'defensive_block', expectedLevel: ComplexityLevel.INTERMEDIATE, question: "What is the difference between a low block and a mid block?" },
  { conceptId: 'defensive_block', expectedLevel: ComplexityLevel.INTERMEDIATE, question: "Who are famous coaches known for defensive blocks?" },
  { conceptId: 'defensive_block', expectedLevel: ComplexityLevel.ADVANCED, question: "How does a compact defensive block restrict central corridor line occupation?" },
  { conceptId: 'defensive_block', expectedLevel: ComplexityLevel.ADVANCED, question: "Analyze the horizontal compactness of a low block against positional play structures." },
  { conceptId: 'defensive_block', expectedLevel: ComplexityLevel.ADVANCED, question: "Explain the structural mechanics of a low block under Diego Simeone's Atletico Madrid." },
  { conceptId: 'defensive_block', expectedLevel: ComplexityLevel.ADVANCED, question: "What are the defensive triggers and marking reference points within a low block?" },
  { conceptId: 'defensive_block', expectedLevel: ComplexityLevel.ADVANCED, question: "How do teams use vertical compactness to neutralize space between the lines?" },

  // 6. Counter Attack Trigger
  { conceptId: 'counter_attack_trigger', expectedLevel: ComplexityLevel.BEGINNER, question: "What is a counter attack?" },
  { conceptId: 'counter_attack_trigger', expectedLevel: ComplexityLevel.BEGINNER, question: "How do counter attacks work?" },
  { conceptId: 'counter_attack_trigger', expectedLevel: ComplexityLevel.BEGINNER, question: "Explain counter attacking simply." },
  { conceptId: 'counter_attack_trigger', expectedLevel: ComplexityLevel.BEGINNER, question: "Why do teams run fast after winning the ball?" },
  { conceptId: 'counter_attack_trigger', expectedLevel: ComplexityLevel.BEGINNER, question: "What is a counter attack trigger?" },
  { conceptId: 'counter_attack_trigger', expectedLevel: ComplexityLevel.INTERMEDIATE, question: "What are the triggers for a counter attack?" },
  { conceptId: 'counter_attack_trigger', expectedLevel: ComplexityLevel.INTERMEDIATE, question: "How do you defend against counter attacks?" },
  { conceptId: 'counter_attack_trigger', expectedLevel: ComplexityLevel.INTERMEDIATE, question: "Who are the most famous counter attacking teams?" },
  { conceptId: 'counter_attack_trigger', expectedLevel: ComplexityLevel.INTERMEDIATE, question: "What are the pros and cons of counter attacks?" },
  { conceptId: 'counter_attack_trigger', expectedLevel: ComplexityLevel.INTERMEDIATE, question: "How does winning the ball deep trigger a counter attack?" },
  { conceptId: 'counter_attack_trigger', expectedLevel: ComplexityLevel.ADVANCED, question: "Analyze transition dynamics and space exploitation during counter-attack triggers." },
  { conceptId: 'counter_attack_trigger', expectedLevel: ComplexityLevel.ADVANCED, question: "How does the rest-defense structure affect the prevention of counter-attack triggers?" },
  { conceptId: 'counter_attack_trigger', expectedLevel: ComplexityLevel.ADVANCED, question: "Explain the role of vertical outlets in optimizing counter-attack transition efficiency." },
  { conceptId: 'counter_attack_trigger', expectedLevel: ComplexityLevel.ADVANCED, question: "Analyze the speed and angle of off-ball runs immediately following defensive turnovers." },
  { conceptId: 'counter_attack_trigger', expectedLevel: ComplexityLevel.ADVANCED, question: "What are the positional tradeoffs between immediate counter-pressing and counter-attacking?" },

  // 7. Inverted Winger
  { conceptId: 'inverted_winger', expectedLevel: ComplexityLevel.BEGINNER, question: "What is an inverted winger?" },
  { conceptId: 'inverted_winger', expectedLevel: ComplexityLevel.BEGINNER, question: "Why does a winger play on the opposite side?" },
  { conceptId: 'inverted_winger', expectedLevel: ComplexityLevel.BEGINNER, question: "Explain inverted winger simply." },
  { conceptId: 'inverted_winger', expectedLevel: ComplexityLevel.BEGINNER, question: "Why do wingers cut inside to shoot?" },
  { conceptId: 'inverted_winger', expectedLevel: ComplexityLevel.BEGINNER, question: "What does inverted winger mean?" },
  { conceptId: 'inverted_winger', expectedLevel: ComplexityLevel.INTERMEDIATE, question: "How do inverted wingers create space for fullbacks?" },
  { conceptId: 'inverted_winger', expectedLevel: ComplexityLevel.INTERMEDIATE, question: "How do you defend against an inverted winger?" },
  { conceptId: 'inverted_winger', expectedLevel: ComplexityLevel.INTERMEDIATE, question: "Who are famous inverted wingers in football history?" },
  { conceptId: 'inverted_winger', expectedLevel: ComplexityLevel.INTERMEDIATE, question: "What are pros and cons of inverted wingers?" },
  { conceptId: 'inverted_winger', expectedLevel: ComplexityLevel.INTERMEDIATE, question: "Why do modern teams prefer inverted wingers over traditional ones?" },
  { conceptId: 'inverted_winger', expectedLevel: ComplexityLevel.ADVANCED, question: "How do inverted wingers occupy half-spaces to manipulate fullback reference points?" },
  { conceptId: 'inverted_winger', expectedLevel: ComplexityLevel.ADVANCED, question: "Analyze the diagonal line-breaking runs of inverted wingers in positional play." },
  { conceptId: 'inverted_winger', expectedLevel: ComplexityLevel.ADVANCED, question: "Explain how inverted wingers facilitate central overloads and third-man runs." },
  { conceptId: 'inverted_winger', expectedLevel: ComplexityLevel.ADVANCED, question: "What are the structural tradeoffs of inverted wingers in terms of crossing width?" },
  { conceptId: 'inverted_winger', expectedLevel: ComplexityLevel.ADVANCED, question: "Analyze how Robben and Salah use body orientation to exploit half-space corridors." },

  // 8. Back 3 / Wingback
  { conceptId: 'back_three_wing_back', expectedLevel: ComplexityLevel.BEGINNER, question: "What is a back 3?" },
  { conceptId: 'back_three_wing_back', expectedLevel: ComplexityLevel.BEGINNER, question: "What does a wingback do?" },
  { conceptId: 'back_three_wing_back', expectedLevel: ComplexityLevel.BEGINNER, question: "Explain the back three system simply." },
  { conceptId: 'back_three_wing_back', expectedLevel: ComplexityLevel.BEGINNER, question: "Why do some teams play with three defenders?" },
  { conceptId: 'back_three_wing_back', expectedLevel: ComplexityLevel.BEGINNER, question: "What is the difference between a fullback and a wingback?" },
  { conceptId: 'back_three_wing_back', expectedLevel: ComplexityLevel.INTERMEDIATE, question: "How does a back three wingback system defend in a low block?" },
  { conceptId: 'back_three_wing_back', expectedLevel: ComplexityLevel.INTERMEDIATE, question: "How do teams counter a back 3 system?" },
  { conceptId: 'back_three_wing_back', expectedLevel: ComplexityLevel.INTERMEDIATE, question: "Who are famous teams that play with a back 3?" },
  { conceptId: 'back_three_wing_back', expectedLevel: ComplexityLevel.INTERMEDIATE, question: "What are the pros and cons of a back 3 wingback system?" },
  { conceptId: 'back_three_wing_back', expectedLevel: ComplexityLevel.INTERMEDIATE, question: "How does a wingback transition from defense to attack?" },
  { conceptId: 'back_three_wing_back', expectedLevel: ComplexityLevel.ADVANCED, question: "Analyze the spatial coverage and wingback recovery lines in a 3-4-3 positional structure." },
  { conceptId: 'back_three_wing_back', expectedLevel: ComplexityLevel.ADVANCED, question: "How does a back three system handle defensive triggers and half-space occupation?" },
  { conceptId: 'back_three_wing_back', expectedLevel: ComplexityLevel.ADVANCED, question: "Explain how wide center-backs facilitate build-up play against high-pressing structures." },
  { conceptId: 'back_three_wing_back', expectedLevel: ComplexityLevel.ADVANCED, question: "What are the structural vulnerabilities of wide center-backs when wingbacks are pinned?" },
  { conceptId: 'back_three_wing_back', expectedLevel: ComplexityLevel.ADVANCED, question: "Analyze the rotational mechanics of a 3-5-2 system in defensive transition phases." },

  // 9. Third Man Run
  { conceptId: 'third_man_run', expectedLevel: ComplexityLevel.BEGINNER, question: "What is a third man run?" },
  { conceptId: 'third_man_run', expectedLevel: ComplexityLevel.BEGINNER, question: "How do you run off the ball?" },
  { conceptId: 'third_man_run', expectedLevel: ComplexityLevel.BEGINNER, question: "Explain third man run simply." },
  { conceptId: 'third_man_run', expectedLevel: ComplexityLevel.BEGINNER, question: "What does a third player do in a pass?" },
  { conceptId: 'third_man_run', expectedLevel: ComplexityLevel.BEGINNER, question: "Why is a third man run hard to stop?" },
  { conceptId: 'third_man_run', expectedLevel: ComplexityLevel.INTERMEDIATE, question: "How do you coordinate a third man run in midfield?" },
  { conceptId: 'third_man_run', expectedLevel: ComplexityLevel.INTERMEDIATE, question: "How do you defend against third man runs?" },
  { conceptId: 'third_man_run', expectedLevel: ComplexityLevel.INTERMEDIATE, question: "What are the pros and cons of third man runs?" },
  { conceptId: 'third_man_run', expectedLevel: ComplexityLevel.INTERMEDIATE, question: "Give me a famous example of a third man run." },
  { conceptId: 'third_man_run', expectedLevel: ComplexityLevel.INTERMEDIATE, question: "How does a third man run break defensive blocks?" },
  { conceptId: 'third_man_run', expectedLevel: ComplexityLevel.ADVANCED, question: "Explain the synchronization of vertical passing lanes to execute a third man run." },
  { conceptId: 'third_man_run', expectedLevel: ComplexityLevel.ADVANCED, question: "How does the False 9 act as the second reference point in third-man combinations?" },
  { conceptId: 'third_man_run', expectedLevel: ComplexityLevel.ADVANCED, question: "Analyze the blind-side runs of midfielders exploiting space created by dropping strikers." },
  { conceptId: 'third_man_run', expectedLevel: ComplexityLevel.ADVANCED, question: "Explain the structural positional play principles that render third-man runs impossible to mark." },
  { conceptId: 'third_man_run', expectedLevel: ComplexityLevel.ADVANCED, question: "Analyze how Xavi and Busquets manipulated defensive structures via third-man sequences." },

  // 10. Compactness
  { conceptId: 'compactness_pressing_lines', expectedLevel: ComplexityLevel.BEGINNER, question: "What is compactness in defense?" },
  { conceptId: 'compactness_pressing_lines', expectedLevel: ComplexityLevel.BEGINNER, question: "Why do defenders stay close together?" },
  { conceptId: 'compactness_pressing_lines', expectedLevel: ComplexityLevel.BEGINNER, question: "Explain pressing lines simply." },
  { conceptId: 'compactness_pressing_lines', expectedLevel: ComplexityLevel.BEGINNER, question: "What does keeping a tight defense mean?" },
  { conceptId: 'compactness_pressing_lines', expectedLevel: ComplexityLevel.BEGINNER, question: "Why is the gap between midfield and defense small?" },
  { conceptId: 'compactness_pressing_lines', expectedLevel: ComplexityLevel.INTERMEDIATE, question: "How does compactness help in high pressing?" },
  { conceptId: 'compactness_pressing_lines', expectedLevel: ComplexityLevel.INTERMEDIATE, question: "How do teams beat a compact defense?" },
  { conceptId: 'compactness_pressing_lines', expectedLevel: ComplexityLevel.INTERMEDIATE, question: "What is the ideal vertical distance between defense and midfield lines?" },
  { conceptId: 'compactness_pressing_lines', expectedLevel: ComplexityLevel.INTERMEDIATE, question: "What are pros and cons of vertical compactness?" },
  { conceptId: 'compactness_pressing_lines', expectedLevel: ComplexityLevel.INTERMEDIATE, question: "Give a famous example of vertical compactness." },
  { conceptId: 'compactness_pressing_lines', expectedLevel: ComplexityLevel.ADVANCED, question: "Analyze the vertical compactness and pressing line distances in Sacchi's AC Milan." },
  { conceptId: 'compactness_pressing_lines', expectedLevel: ComplexityLevel.ADVANCED, question: "How does defensive line height affect pressing trap efficiency and rest-defense compactness?" },
  { conceptId: 'compactness_pressing_lines', expectedLevel: ComplexityLevel.ADVANCED, question: "Detail how vertical compactness limits opponent line occupation and central corridor progression." },
  { conceptId: 'compactness_pressing_lines', expectedLevel: ComplexityLevel.ADVANCED, question: "Analyze the structural tradeoffs of high pressing lines against long-ball space exploitation." },
  { conceptId: 'compactness_pressing_lines', expectedLevel: ComplexityLevel.ADVANCED, question: "Explain how compactness principles affect the transition speed of pressing blocks." }
];

async function runTests() {
  console.log(`🚀 Starting Automatic Knowledge Level Detection test suite...`);
  console.log(`Evaluating ${scenarios.length} scenarios across 10 concepts...\n`);

  let passed = 0;
  let failed = 0;
  const startTime = Date.now();

  const resultsByConcept: Record<string, { total: number; correct: number }> = {};
  const resultsByLevel: Record<string, { total: number; correct: number }> = {
    [ComplexityLevel.BEGINNER]: { total: 0, correct: 0 },
    [ComplexityLevel.INTERMEDIATE]: { total: 0, correct: 0 },
    [ComplexityLevel.ADVANCED]: { total: 0, correct: 0 }
  };

  const failureDetails: Array<{ scenario: Scenario; detected: string; score: number; evidence: string[] }> = [];

  for (const s of scenarios) {
    if (!resultsByConcept[s.conceptId]) {
      resultsByConcept[s.conceptId] = { total: 0, correct: 0 };
    }

    resultsByConcept[s.conceptId].total++;
    resultsByLevel[s.expectedLevel].total++;

    const startDet = performance.now();
    const result = KnowledgeLevelDetector.detect(s.question, []);
    const latency = performance.now() - startDet;

    const isMatch = result.detected_level === s.expectedLevel;

    if (isMatch) {
      passed++;
      resultsByConcept[s.conceptId].correct++;
      resultsByLevel[s.expectedLevel].correct++;
    } else {
      failed++;
      failureDetails.push({
        scenario: s,
        detected: result.detected_level,
        score: result.confidence_score,
        evidence: result.evidence
      });
    }

    // Performance target check: Must be under 100ms
    if (latency >= 100) {
      console.warn(`⚠️ Warning: Query "${s.question}" detection exceeded performance threshold: ${latency.toFixed(2)}ms`);
    }
  }

  const elapsed = Date.now() - startTime;
  const accuracy = (passed / scenarios.length) * 100;

  console.log(`======================================================`);
  console.log(`🏁 TESTS COMPLETED IN ${elapsed}ms`);
  console.log(`Accuracy: ${accuracy.toFixed(1)}% (${passed}/${scenarios.length} scenarios passed)`);
  console.log(`Passed: ${passed} | Failed: ${failed}`);
  console.log(`======================================================\n`);

  // Write markdown report
  const reportPath = path.resolve(__dirname, '../../artifacts/test_report.md');
  const dirPath = path.dirname(reportPath);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  let markdown = `# Knowledge Level Detection Test Report\n\n`;
  markdown += `* **Test Date**: ${new Date().toISOString()}\n`;
  markdown += `* **Total Scenarios Evaluated**: ${scenarios.length}\n`;
  markdown += `* **Passing**: ${passed} / ${scenarios.length}\n`;
  markdown += `* **Accuracy**: ${accuracy.toFixed(2)}%\n`;
  markdown += `* **Total Latency**: ${elapsed}ms (avg. ${(elapsed / scenarios.length).toFixed(2)}ms per query)\n\n`;

  markdown += `## Metrics by Level\n\n`;
  markdown += `| Level | Scenarios | Correct | Accuracy |\n`;
  markdown += `|-------|-----------|---------|----------|\n`;
  for (const [lvl, metric] of Object.entries(resultsByLevel)) {
    const lvlAcc = metric.total > 0 ? (metric.correct / metric.total) * 100 : 0;
    markdown += `| ${lvl} | ${metric.total} | ${metric.correct} | ${lvlAcc.toFixed(1)}% |\n`;
  }
  markdown += `\n`;

  markdown += `## Metrics by Concept\n\n`;
  markdown += `| Concept ID | Scenarios | Correct | Accuracy |\n`;
  markdown += `|------------|-----------|---------|----------|\n`;
  for (const [concept, metric] of Object.entries(resultsByConcept)) {
    const concAcc = metric.total > 0 ? (metric.correct / metric.total) * 100 : 0;
    markdown += `| \`${concept}\` | ${metric.total} | ${metric.correct} | ${concAcc.toFixed(1)}% |\n`;
  }
  markdown += `\n`;

  if (failureDetails.length > 0) {
    markdown += `## Failures Details\n\n`;
    failureDetails.forEach((fd, index) => {
      markdown += `### ${index + 1}. Concept: \`${fd.scenario.conceptId}\`\n`;
      markdown += `* **Question**: "${fd.scenario.question}"\n`;
      markdown += `* **Expected Level**: \`${fd.scenario.expectedLevel}\`\n`;
      markdown += `* **Detected Level**: \`${fd.detected}\` (Confidence: ${fd.score.toFixed(2)})\n`;
      markdown += `* **Evidence Log**:\n`;
      fd.evidence.forEach(e => {
        markdown += `  - ${e}\n`;
      });
      markdown += `\n`;
    });
  } else {
    markdown += `> [!IMPORTANT]\n`;
    markdown += `> All 150 tactical queries were correctly detected! Level Detection Engine passes all regression tests.\n`;
  }

  fs.writeFileSync(reportPath, markdown, 'utf-8');
  console.log(`Test report successfully generated and saved to artifacts directory:`);
  console.log(`[test_report.md](file://${reportPath})\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
