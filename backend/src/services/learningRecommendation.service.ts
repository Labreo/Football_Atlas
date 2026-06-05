import * as fs from 'fs';
import * as path from 'path';
import {
  LearnerProfile,
  ConceptMastery,
  LearningPath,
  LearningRecommendations,
  tacticalRegistry,
} from '@football-atlas/shared';
import { conceptMasteryRepository } from '../repositories/conceptMastery.repository';
import { historicalExampleService } from './historicalExample.service';
import { Logger } from '../utils/logger';

const PATHS_FILE = path.resolve(__dirname, '../../data/learning_paths.json');

const CONCEPT_PREREQUISITES: Record<string, string[]> = {
  pressing_trap: ['high_press', 'compactness_pressing_lines'],
  midfield_overload: ['compactness_pressing_lines'],
  third_man_run: ['compactness_pressing_lines'],
  counter_attack_trigger: ['compactness_pressing_lines'],
  back_three_wing_back: ['compactness_pressing_lines'],
};

function getPrerequisites(conceptId: string): string[] {
  return CONCEPT_PREREQUISITES[conceptId] || [];
}

export class LearningRecommendationService {
  private static instance: LearningRecommendationService;
  private paths: LearningPath[] = [];

  private constructor() {
    this.loadPaths();
  }

  public static getInstance(): LearningRecommendationService {
    if (!LearningRecommendationService.instance) {
      LearningRecommendationService.instance = new LearningRecommendationService();
    }
    return LearningRecommendationService.instance;
  }

  private loadPaths(): void {
    try {
      if (fs.existsSync(PATHS_FILE)) {
        const raw = fs.readFileSync(PATHS_FILE, 'utf-8');
        this.paths = JSON.parse(raw);
        Logger.info(`[LearningRecommendationService] Loaded ${this.paths.length} learning paths.`);
      } else {
        Logger.warn('[LearningRecommendationService] No learning paths seed file found.');
      }
    } catch (err: any) {
      Logger.error(`[LearningRecommendationService] Failed to load paths: ${err.message}`);
    }
  }

  public getPaths(): LearningPath[] {
    return this.paths;
  }

  public getPathById(pathId: string): LearningPath | undefined {
    return this.paths.find((p) => p.path_id === pathId);
  }

  /**
   * Resolves structural recommendations for a learner.
   */
  public generateRecommendations(
    profile: LearnerProfile,
    allMastery: ConceptMastery[]
  ): LearningRecommendations {
    const completedSet = new Set(profile.completed_concepts);
    const masteryMap = new Map(allMastery.map((m) => [m.concept_id, m]));

    let nextConceptId: string | null = null;
    let explanation = '';

    // 1. Resolve Next Concept
    if (profile.active_path_id) {
      const activePath = this.getPathById(profile.active_path_id);
      if (activePath) {
        // Find the first incomplete concept in the active path
        const nextInPath = activePath.ordered_concepts.find(
          (cid) => !completedSet.has(cid)
        );

        if (nextInPath) {
          // Check if this concept has unmet prerequisites
          const conceptObj = tacticalRegistry.getConcept(nextInPath);
          const unmetPrereqs = getPrerequisites(nextInPath).filter(
            (p: string) => !completedSet.has(p)
          );

          if (unmetPrereqs.length > 0) {
            // Recommend the first unmet prerequisite instead
            const prereqId = unmetPrereqs[0];
            nextConceptId = prereqId;
            const prereqName =
              tacticalRegistry.getConcept(prereqId)?.concept_name || prereqId;
            explanation = `We recommend learning ${prereqName} first, as it is a prerequisite for ${
              conceptObj?.concept_name || nextInPath
            } in the "${activePath.title}" path.`;
          } else {
            nextConceptId = nextInPath;
            explanation = `This is the next logical step in your active learning path: "${activePath.title}".`;
          }
        } else {
          explanation = `You have completed all concepts in the "${activePath.title}" path! `;
        }
      }
    }

    // If no path is active, or the path is completed, recommend general next steps
    if (!nextConceptId) {
      // Find a concept where all prerequisites are met, but it is not completed
      const allConcepts = tacticalRegistry.getAllConcepts();
      
      // Sort by difficulty (beginner -> intermediate -> advanced)
      const sortedConcepts = [...allConcepts].sort((a, b) => {
        const diffMap: Record<string, number> = { beginner: 1, intermediate: 2, advanced: 3 };
        return (
          diffMap[a.complexity.toLowerCase()] - diffMap[b.complexity.toLowerCase()]
        );
      });

      const nextEligible = sortedConcepts.find((c) => {
        if (completedSet.has(c.concept_id)) return false;
        
        // Ensure all prerequisites are completed
        const prereqs = getPrerequisites(c.concept_id);
        return prereqs.every((p: string) => completedSet.has(p));
      });

      if (nextEligible) {
        nextConceptId = nextEligible.concept_id;
        explanation = `Based on your level, we recommend exploring ${nextEligible.concept_name}. It fits your difficulty curve and has all prerequisites completed.`;
      } else {
        // If everything is completed, find any incomplete concept
        const fallback = allConcepts.find((c) => !completedSet.has(c.concept_id));
        if (fallback) {
          nextConceptId = fallback.concept_id;
          explanation = `Explore ${fallback.concept_name} to continue your tactical development.`;
        }
      }
    }

    if (!nextConceptId && completedSet.size > 0) {
      // Everything completed!
      nextConceptId = null;
      explanation = 'Congratulations! You have completed all 10 core tactical concepts in Football Atlas!';
    }

    // 2. Resolve Next Historical Example & Next Breakdown
    let nextExampleId: string | null = null;
    let nextBreakdownId: string | null = null;

    const targetConceptId = nextConceptId || (profile.completed_concepts.length > 0 ? profile.completed_concepts[profile.completed_concepts.length - 1] : 'false_9');

    if (targetConceptId) {
      // Find uncompleted historical examples for this concept
      const examples = historicalExampleService.getExamplesByConcept(targetConceptId);
      const uncompletedExamples = examples.filter(
        (ex) => !profile.completed_breakdowns.includes(ex.example_id)
      );

      if (uncompletedExamples.length > 0) {
        // Recommend the first uncompleted example/breakdown
        nextExampleId = uncompletedExamples[0].example_id;
        nextBreakdownId = uncompletedExamples[0].example_id; // breakdown shares exampleId
      } else {
        // Fallback to any uncompleted example in the database
        const allExamples = historicalExampleService.getExamplesByCoach(''); // loads all by ignoring coach filter
        const fallbackEx = allExamples.find(
          (ex) => !profile.completed_breakdowns.includes(ex.example_id)
        );
        if (fallbackEx) {
          nextExampleId = fallbackEx.example_id;
          nextBreakdownId = fallbackEx.example_id;
        }
      }
    }

    // 3. Resolve Related Concepts
    let relatedConceptIds: string[] = [];
    if (nextConceptId) {
      const conceptObj = tacticalRegistry.getConcept(nextConceptId);
      relatedConceptIds = conceptObj?.related_concepts || [];
    } else if (profile.completed_concepts.length > 0) {
      const lastConcept = profile.completed_concepts[profile.completed_concepts.length - 1];
      const conceptObj = tacticalRegistry.getConcept(lastConcept);
      relatedConceptIds = conceptObj?.related_concepts || [];
    }

    return {
      next_concept_id: nextConceptId,
      next_example_id: nextExampleId,
      next_breakdown_id: nextBreakdownId,
      related_concept_ids: relatedConceptIds,
      explanation: explanation || 'Select a learning path on your journey dashboard to begin.',
    };
  }
}

export const learningRecommendationService = LearningRecommendationService.getInstance();
export default learningRecommendationService;
