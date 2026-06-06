import { ComplexityLevel, HistoricalExample } from '@football-atlas/shared';

export class ExplanationAdaptationLayer {
  private static instance: ExplanationAdaptationLayer;

  private constructor() {}

  public static getInstance(): ExplanationAdaptationLayer {
    if (!ExplanationAdaptationLayer.instance) {
      ExplanationAdaptationLayer.instance = new ExplanationAdaptationLayer();
    }
    return ExplanationAdaptationLayer.instance;
  }

  /**
   * Modifies/adapts a concept explanation text based on the target complexity level.
   */
  public adaptExplanation(conceptId: string, level: ComplexityLevel, baseText: string): string {
    // Custom mappings for targeted target experiences
    if (conceptId === 'false_9') {
      if (level === ComplexityLevel.BEGINNER) {
        return `A False 9 is a striker who moves away from the goal to create space.\n\nBy dropping deep into the midfield, they draw defenders out of position, opening up simple passing lanes for wingers cutting inside to run toward the goal. Think of it like a decoy runner pulling a defender away to leave a teammate completely open.`;
      }
      if (level === ComplexityLevel.ADVANCED) {
        return `The False 9 destabilizes defensive reference points and creates central superiority during positional attacks.\n\nBy withdrawing from the defensive line into the intermediate space, the False 9 manipulates central defender reference coordinates, establishing central superiority (+1 midfield overload) during positional play. This structural disruption creates vertical spacing gaps that inverted wingers exploit via half-space runs.`;
      }
      // Intermediate (default)
      return `A False 9 pulls defenders out of position and creates midfield overloads.\n\nIn this role, the center forward drops deep into central midfield, pulling the opposing center-backs out of their defensive lines. This creates numerical superiority (overloads) in midfield to dominate possession, opening vertical channels for wingers to exploit.`;
    }

    // Generic fallback adaptations for other concepts if they don't have custom overrides
    if (level === ComplexityLevel.BEGINNER) {
      return this.simplifyToBeginner(baseText);
    }
    if (level === ComplexityLevel.ADVANCED) {
      return this.sophisticateToAdvanced(baseText);
    }
    return baseText; // intermediate
  }

  /**
   * Adapts the historical example description or comparison.
   */
  public adaptHistoricalExplanation(
    conceptId: string,
    level: ComplexityLevel,
    example: HistoricalExample,
    baseExplanation: string
  ): string {
    if (conceptId === 'false_9') {
      if (level === ComplexityLevel.BEGINNER) {
        return `Example:
${example.match_name} (${example.season})
Player: Lionel Messi (Barcelona)

Tactical Context:
Lionel Messi dropped deep away from the opposition's goal, acting as a decoy.

Explanation:
Pep Guardiola famously deployed Lionel Messi centrally in the 2009 UEFA Champions League Final against Manchester United in a "False 9" role. Messi dropped deep into midfield to get the ball, pulling Manchester United's central defenders Ferdinand and Vidic out of position. This created massive space behind them for Thierry Henry and Samuel Eto'o to run into. It is a classic example of creating space by dropping deep.`;
      }
      if (level === ComplexityLevel.ADVANCED) {
        return `Example: Spain 2012 / Barca 2009 / Liverpool 2018 False 9 Comparison
Players: Lionel Messi vs Roberto Firmino vs Cesc Fàbregas

Tactical Context:
Comparative analysis of False 9 profiles: Deep playmaker (Messi), pressing engine (Firmino), and midfield link player (Fàbregas).

Explanation:
In advanced positional structures, the False 9 has three distinct archetypal implementations:
1. **Lionel Messi (Barcelona, 2009)**: Deployed by Pep Guardiola as a vertical space manipulator. Messi drops into Zone 14 to receive on the half-turn, engaging CBs in 1v1 dilemmas and unlocking diagonal channels for inverted wingers.
2. **Roberto Firmino (Liverpool, 2018)**: Mastered by Jürgen Klopp as a defensive pressing trigger and transition catalyst. Firmino cuts off central passing lines to holding midfielders and leads the counter-press immediately upon turnovers.
3. **Cesc Fàbregas (Spain, 2012)**: Vicente del Bosque's "strikerless" 4-6-0 model. Fàbregas acted purely as an extra midfielder to secure total possession dominance and overload central defensive blocks.`;
      }
    }

    // Default return
    return baseExplanation;
  }

  private simplifyToBeginner(text: string): string {
    return text
      .replace(/\bZone 14\b/gi, 'area in front of the penalty box')
      .replace(/\bhalf-spaces\b/gi, 'channels between the center and wings')
      .replace(/\bhalf-space\b/gi, 'channel between the center and wings')
      .replace(/\bnumerical overload\b/gi, 'extra player advantage')
      .replace(/\bmidfield overloads\b/gi, 'extra numbers in midfield')
      .replace(/\bpressing trigger\b/gi, 'moment to start defending')
      .replace(/\bpressing trap\b/gi, 'defensive trap to win the ball')
      .replace(/\bpositional attacks\b/gi, 'attacks')
      .replace(/\bdefensive reference points\b/gi, 'defenders marking targets');
  }

  private sophisticateToAdvanced(text: string): string {
    return text
      .replace(/\bstriker dropping deep\b/gi, 'withdrawn striker dropping to manipulate central defensive reference coordinates')
      .replace(/\bextra player in midfield\b/gi, 'numerical overload (+1 superiority) in the central corridor')
      .replace(/\bdefensive trap\b/gi, 'structured pressing trap enforcing a deterministic turnover trigger');
  }
}

export const explanationAdaptationLayer = ExplanationAdaptationLayer.getInstance();
