import { HistoricalExample, ComplexityLevel } from '@football-atlas/shared';
import { historicalExampleRepository } from '../repositories/historicalExample.repository';

export class HistoricalExampleService {
  private static instance: HistoricalExampleService;

  private constructor() {}

  public static getInstance(): HistoricalExampleService {
    if (!HistoricalExampleService.instance) {
      HistoricalExampleService.instance = new HistoricalExampleService();
    }
    return HistoricalExampleService.instance;
  }

  public getExamplesByConcept(conceptId: string): HistoricalExample[] {
    return historicalExampleRepository.getByConcept(conceptId);
  }

  public getExamplesByCoach(coach: string): HistoricalExample[] {
    const coachLower = coach.toLowerCase();
    return historicalExampleRepository.getAll().filter(item => 
      item.coach.toLowerCase().includes(coachLower)
    );
  }

  public getExamplesByTeam(team: string): HistoricalExample[] {
    const teamLower = team.toLowerCase();
    return historicalExampleRepository.getAll().filter(item => 
      item.teams.some(t => t.toLowerCase().includes(teamLower))
    );
  }

  public getExamplesByPlayer(player: string): HistoricalExample[] {
    const playerLower = player.toLowerCase();
    return historicalExampleRepository.getAll().filter(item => 
      item.players.some(p => p.toLowerCase().includes(playerLower))
    );
  }

  /**
   * Selection & Ranking Engine:
   * Selects the highest ranking historical example for a concept matching the user's complexity,
   * excluding matches already present in sessionHistory.
   */
  public getBestExample(
    conceptId: string,
    userComplexity: ComplexityLevel = ComplexityLevel.BEGINNER,
    sessionHistory: string[] = []
  ): HistoricalExample | undefined {
    const candidates = this.getExamplesByConcept(conceptId)
      .filter(item => !sessionHistory.includes(item.example_id));

    if (candidates.length === 0) {
      return undefined;
    }

    // Rank candidates
    const ranked = candidates.map(item => {
      let score = item.confidence_score;

      // Boost based on complexity level matching beginner_friendly flag
      if (userComplexity === ComplexityLevel.BEGINNER) {
        if (item.beginner_friendly) {
          score += 30; // Strong boost for beginner friendly examples
        }
      } else if (userComplexity === ComplexityLevel.ADVANCED) {
        if (!item.beginner_friendly) {
          score += 30; // Boost advanced examples
        }
      } else { // INTERMEDIATE
        score += 15; // Moderate boost
      }

      // Boost based on approved review status
      if (item.review_status === 'approved') {
        score += 10;
      }

      return { item, score };
    });

    // Sort descending by score
    ranked.sort((a, b) => b.score - a.score);

    return ranked[0]?.item;
  }
}

export const historicalExampleService = HistoricalExampleService.getInstance();
