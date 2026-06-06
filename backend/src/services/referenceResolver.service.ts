import { SessionContext } from './context.manager';

export interface ReferenceResolution {
  resolved: boolean;
  resolvedConceptId: string | null;
  resolvedExampleId: string | null;
  resolvedMatchId: string | null;
  resolvedPlayer: string | null;
  resolvedCoach: string | null;
  resolvedBreakdownId: string | null;
  evidence: string[];
}

export class ReferenceResolver {
  /**
   * Resolves implicit references in the user's question based on the conversation session history.
   */
  public static resolve(question: string, session: SessionContext): ReferenceResolution {
    const q = question.toLowerCase();
    const resolution: ReferenceResolution = {
      resolved: false,
      resolvedConceptId: session.last_concept || session.context.active_concept,
      resolvedExampleId: session.last_example || session.context.active_example,
      resolvedMatchId: session.last_match || session.context.active_match,
      resolvedPlayer: session.last_player,
      resolvedCoach: session.last_coach,
      resolvedBreakdownId: session.last_breakdown || session.context.active_breakdown,
      evidence: []
    };

    // Pronouns and phrases to check
    const pronounMatch = /\b(that|it|this|those|they|them|these)\b/i.test(q);
    const movementMatch = /\b(that movement|that space|that run|that shape)\b/i.test(q);

    if (pronounMatch || movementMatch) {
      resolution.resolved = true;
      
      if (movementMatch) {
        resolution.evidence.push(`Resolved spatial movement/run phrase from active concept: ${resolution.resolvedConceptId}`);
      }

      // Check if user is referencing a player or coach of the active example/match
      if (/\b(he|him|his|they|them|doing it|did it|do it)\b/i.test(q)) {
        if (session.last_player) {
          resolution.evidence.push(`Resolved player pronoun: ${session.last_player}`);
        }
        if (session.last_coach) {
          resolution.evidence.push(`Resolved coach pronoun: ${session.last_coach}`);
        }
      }

      if (resolution.resolvedConceptId) {
        resolution.evidence.push(`Resolved general concept pronoun to active concept: ${resolution.resolvedConceptId}`);
      }
    }

    // Context-dependent check for specific players/coaches
    // E.g. "How did Messi do it?" -> resolves "it" to last_concept and player to "Lionel Messi"
    if (q.includes('messi') && !resolution.resolvedPlayer) {
      resolution.resolvedPlayer = 'Lionel Messi';
      resolution.evidence.push('Resolved player mention: Lionel Messi');
    }
    if (q.includes('robben') && !resolution.resolvedPlayer) {
      resolution.resolvedPlayer = 'Arjen Robben';
      resolution.evidence.push('Resolved player mention: Arjen Robben');
    }
    if (q.includes('salah') && !resolution.resolvedPlayer) {
      resolution.resolvedPlayer = 'Mohamed Salah';
      resolution.evidence.push('Resolved player mention: Mohamed Salah');
    }
    if (q.includes('firmino') && !resolution.resolvedPlayer) {
      resolution.resolvedPlayer = 'Roberto Firmino';
      resolution.evidence.push('Resolved player mention: Roberto Firmino');
    }
    if (q.includes('fabregas') && !resolution.resolvedPlayer) {
      resolution.resolvedPlayer = 'Cesc Fàbregas';
      resolution.evidence.push('Resolved player mention: Cesc Fàbregas');
    }
    if (q.includes('totti') && !resolution.resolvedPlayer) {
      resolution.resolvedPlayer = 'Francesco Totti';
      resolution.evidence.push('Resolved player mention: Francesco Totti');
    }

    if ((q.includes('guardiola') || q.includes('pep')) && !resolution.resolvedCoach) {
      resolution.resolvedCoach = 'Pep Guardiola';
      resolution.evidence.push('Resolved coach mention: Pep Guardiola');
    }
    if (q.includes('klopp') && !resolution.resolvedCoach) {
      resolution.resolvedCoach = 'Jürgen Klopp';
      resolution.evidence.push('Resolved coach mention: Jürgen Klopp');
    }
    if (q.includes('simeone') && !resolution.resolvedCoach) {
      resolution.resolvedCoach = 'Diego Simeone';
      resolution.evidence.push('Resolved coach mention: Diego Simeone');
    }
    if (q.includes('mourinho') && !resolution.resolvedCoach) {
      resolution.resolvedCoach = 'José Mourinho';
      resolution.evidence.push('Resolved coach mention: José Mourinho');
    }

    return resolution;
  }
}
