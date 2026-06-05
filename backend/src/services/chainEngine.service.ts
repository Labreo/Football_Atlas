import { ConversationContext } from '@football-atlas/shared';
import { conceptVocabularyService } from './vocabulary.service';

export interface TransitionOutcome {
  conceptId: string;
  branch?: 'A' | 'B';
  intent: string;
  isTransition: boolean;
}

export class ConceptChainEngine {
  private static instance: ConceptChainEngine;

  private constructor() {}

  public static getInstance(): ConceptChainEngine {
    if (!ConceptChainEngine.instance) {
      ConceptChainEngine.instance = new ConceptChainEngine();
    }
    return ConceptChainEngine.instance;
  }

  /**
   * Evaluates user question against vocabulary and active context to decide which concept / intent is targeted.
   */
  public evaluateTransition(
    question: string,
    context: ConversationContext
  ): TransitionOutcome {
    const q = question.toLowerCase();

    // 1. First check if a concept is explicitly mentioned in the query
    const explicitConcept = conceptVocabularyService.detectConceptFromQuery(q);
    if (explicitConcept) {
      const isTransition = explicitConcept !== context.active_concept;
      return {
        conceptId: explicitConcept,
        intent: 'explicit_query',
        isTransition,
      };
    }

    // 2. If no explicit concept, check if the query contains implicit references ("that", "this", "it", "next", etc.)
    const isImplicit = /\b(that|this|it|they|them|these|next|then)\b/i.test(q) || 
                       /how would|what happens|why does|what problems/i.test(q);

    if (isImplicit && context.active_concept) {
      const active = context.active_concept;

      // --- Example Chain 1: False 9 ---
      if (active === 'false_9') {
        if (/\b(defend|defender|defensive|respond|response|reaction|counter|follow|hold|choice|choose)\b/i.test(q)) {
          // If they ask how defenders respond to "that" (False 9), stay on False 9 but switch to defender response
          return {
            conceptId: 'false_9',
            branch: q.includes('hold') || q.includes('free') ? 'B' : 'A', // LCB follow (A) vs hold (B)
            intent: 'defensive_response',
            isTransition: false,
          };
        }
        if (/\b(midfield|problems|overload|numerical|superiority|extra player|space)\b/i.test(q)) {
          // False 9 ➔ Midfield Overload
          return {
            conceptId: 'midfield_overload',
            intent: 'midfield_impact',
            isTransition: true,
          };
        }
      }

      if (active === 'midfield_overload') {
        if (/\b(third man|run|combination|passing|option|outlet|play forward)\b/i.test(q)) {
          // Midfield Overload ➔ Third Man Run
          return {
            conceptId: 'third_man_run',
            intent: 'attacking_progression',
            isTransition: true,
          };
        }
      }

      // --- Example Chain 2: High Press ---
      if (active === 'high_press') {
        if (/\b(trap|funnel|lure|pressing trap|sideline|touchline|bait)\b/i.test(q)) {
          // High Press ➔ Pressing Trap
          return {
            conceptId: 'pressing_trap',
            intent: 'pressing_trap',
            isTransition: true,
          };
        }
      }

      if (active === 'pressing_trap') {
        if (/\b(compact|compactness|distance|pressing lines|line distance|stay compact|lines|shifting)\b/i.test(q)) {
          // Pressing Trap ➔ Compactness
          return {
            conceptId: 'compactness_pressing_lines',
            intent: 'compactness_alignment',
            isTransition: true,
          };
        }
      }

      if (active === 'compactness_pressing_lines') {
        if (/\b(block|defensive block|defend deep|deep defense|4-4-2|flat block|parking)\b/i.test(q)) {
          // Compactness ➔ Defensive Block
          return {
            conceptId: 'defensive_block',
            intent: 'defensive_shape',
            isTransition: true,
          };
        }
      }

      // --- Example Chain 3: Counter Attack Trigger ---
      if (active === 'counter_attack_trigger') {
        if (/\b(defensive transition|transition|recover|recovery|back three|back 3|wingback|wing-back|three central)\b/i.test(q)) {
          // Counter Attack Trigger ➔ Back Three Recovery / Wing-Back System
          return {
            conceptId: 'back_three_wing_back',
            intent: 'defensive_transition',
            isTransition: true,
          };
        }
      }

      // Default implicit fallbacks: maintain active concept
      return {
        conceptId: active,
        intent: 'follow_up',
        isTransition: false,
      };
    }

    // 3. Absolute fallback: Return active concept if any, otherwise return empty
    return {
      conceptId: context.active_concept || '',
      intent: 'unknown',
      isTransition: false,
    };
  }
}

export const conceptChainEngine = ConceptChainEngine.getInstance();
