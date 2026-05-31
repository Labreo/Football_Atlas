export class DoclingService {
  /**
   * Simulates retrieval of reference text passages processed by IBM Docling.
   * Grounding explanations in literature makes our tactical AI highly professional.
   */
  public getChunksForConcept(conceptId: string): string[] {
    const database: Record<string, string[]> = {
      false_9: [
        "[UEFA Coaching Manual v3.4] - The 'False 9' operates in the zone between the opposition's defensive line and midfield (Zone 14). By dropping deep, this player creates numerical superiority in central midfield (often a 4v3 or 5v4) and disrupts the defensive line's marking system.",
        "[Positional Play Fundamentals, Ch. 2] - The central defender is faced with a systemic dilemma: if they follow the False 9 into midfield, a vertical channel is vacated in the defensive line for inside forwards to exploit. If they remain, the False 9 turns and carries the ball forward with visual superiority."
      ],
      high_press: [
        "[Klopp Pressing Blueprint] - The high press relies on coordinated pressing triggers. The press initiates when the ball travels to a specific target (usually the opponent's fullback or a weak foot pass). The nearest player applies immediate max intensity pressure while teammates lock passing lines.",
        "[Defensive Transitions, Section 7] - Maintaining team compactness is critical during a high press. The distance between the front pressing line and the defensive line must not exceed 25-30 meters. This restricts the opponent's ability to find free players in vertical gaps."
      ],
      pressing_trap: [
        "[Sacchi Milan Study, Vol 1] - A pressing trap is an intentional defensive posture that invites the opponent to pass into a seemingly open space (the 'trap zone'). Once the pass is made, adjacent defenders close all angles simultaneously, creating a high-turnover box.",
        "[Tactical Periodization Manual] - Pressing traps require defensive triggers: forcing the opponent's weakest player onto their weak foot, or funneling possession towards the touchline where the boundary acts as an extra defender."
      ]
    };

    return database[conceptId] || [
      `[Docling Ingest Base] - General coaching principles outline positioning, spatial control, and ball progression rules for ${conceptId.replace('_', ' ')}.`
    ];
  }
}
