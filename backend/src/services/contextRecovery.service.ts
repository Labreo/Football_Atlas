import { SessionContext } from './context.manager';

export interface ContextRecoveryResult {
  recovered: boolean;
  recoveredConceptId: string | null;
  recoveredExampleId: string | null;
  evidence: string[];
}

export class ContextRecoveryService {
  /**
   * Detects if the user's question intends to recover a previous tactical context, and returns the recovered details.
   */
  public static evaluate(question: string, session: SessionContext): ContextRecoveryResult {
    const q = question.toLowerCase();
    const result: ContextRecoveryResult = {
      recovered: false,
      recoveredConceptId: null,
      recoveredExampleId: null,
      evidence: []
    };

    const isRecoveryPhrase = /going back to|go back to|return to|back to our|talking about earlier/i.test(q);

    if (isRecoveryPhrase) {
      // Look for a concept keyword in the question
      let targetConcept = '';
      if (q.includes('false 9') || q.includes('false9') || q.includes('dropped striker')) {
        targetConcept = 'false_9';
      } else if (q.includes('high press') || q.includes('gegenpress') || q.includes('pressing high')) {
        targetConcept = 'high_press';
      } else if (q.includes('pressing trap') || q.includes('press trap')) {
        targetConcept = 'pressing_trap';
      } else if (q.includes('overload') || q.includes('midfield overload')) {
        targetConcept = 'midfield_overload';
      } else if (q.includes('defensive block') || q.includes('compact block')) {
        targetConcept = 'defensive_block';
      } else if (q.includes('low block') || q.includes('defending deep')) {
        targetConcept = 'defensive_block';
      } else if (q.includes('counter') || q.includes('transition') || q.includes('counter-attack')) {
        targetConcept = 'counter_attack_trigger';
      } else if (q.includes('inverted') || q.includes('winger') || q.includes('cut inside')) {
        targetConcept = 'inverted_winger';
      } else if (q.includes('back three') || q.includes('back 3') || q.includes('wingback') || q.includes('wing-back')) {
        targetConcept = 'back_three_wing_back';
      } else if (q.includes('third man') || q.includes('off-ball run') || q.includes('third-man')) {
        targetConcept = 'third_man_run';
      } else if (q.includes('compactness') || q.includes('pressing lines') || q.includes('compact')) {
        targetConcept = 'compactness_pressing_lines';
      }

      if (targetConcept) {
        result.recovered = true;
        result.recoveredConceptId = targetConcept;
        result.evidence.push(`Recovered concept "${targetConcept}" explicitly mentioned in recovery phrase.`);
      } else {
        // Fall back to restoring the most recent previous concept if they just say "go back"
        const prev = session.context.previous_concepts;
        if (prev && prev.length > 0) {
          result.recovered = true;
          result.recoveredConceptId = prev[prev.length - 1];
          result.evidence.push(`Recovered most recent previous concept "${result.recoveredConceptId}" from session history.`);
        }
      }

      // Check for example context recovery
      if (q.includes('example') || q.includes('match') || q.includes('breakdown') || q.includes('messi')) {
        if (session.last_example) {
          result.recoveredExampleId = session.last_example;
          result.evidence.push(`Recovered active example context: ${session.last_example}`);
        }
      }
    }

    return result;
  }
}
