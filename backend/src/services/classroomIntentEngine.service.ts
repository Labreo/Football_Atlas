import { ConversationContext } from '@football-atlas/shared';
import { historicalExampleService } from './historicalExample.service';
import { conceptVocabularyService } from './vocabulary.service';
import { historicalExampleRepository } from '../repositories/historicalExample.repository';
import { conceptChainEngine } from './chainEngine.service';

export type ClassroomIntent =
  | 'CONCEPT_EXPLANATION'
  | 'RELATED_CONCEPT'
  | 'REAL_WORLD_EXAMPLE'
  | 'HISTORICAL_BREAKDOWN'
  | 'PLAYER_EXAMPLE'
  | 'COACH_EXAMPLE'
  | 'TEAM_EXAMPLE'
  | 'MATCH_EXAMPLE'
  | 'TACTICAL_COMPARISON'
  | 'CONCEPT_CHAIN';

export interface ClassroomAction {
  type: 'LAUNCH_CONCEPT' | 'LAUNCH_MATCH' | 'LAUNCH_HISTORICAL_EXAMPLE' | 'LAUNCH_HISTORICAL_BREAKDOWN' | 'OPEN_RELATED_CONCEPT';
  label: string;
  payload: {
    concept_id?: string;
    match_id?: string;
    example_id?: string;
    breakdown_id?: string;
  };
}

export interface IntentEvaluationResult {
  intent: ClassroomIntent;
  confidence: number;
  matchedConceptId?: string;
  actions: ClassroomAction[];
}

export interface PlayerTacticalProfile {
  name: string;
  concepts: string[];
  examples: string[];
}

export interface CoachTacticalProfile {
  name: string;
  concepts: string[];
  examples: string[];
}

export interface ConceptGraphNode {
  conceptId: string;
  historicalMatches: string[]; // example_ids
  historicalBreakdowns: string[]; // breakdown_ids
  keyPlayers: string[];
  keyCoaches: string[];
}

export class ClassroomIntentEngine {
  private static instance: ClassroomIntentEngine;

  // Player tactical profiles
  private playerProfiles: Record<string, PlayerTacticalProfile> = {
    messi: {
      name: 'Lionel Messi',
      concepts: ['false_9', 'third_man_run', 'midfield_overload'],
      examples: ['barcelona_2009_f9', 'barca_clasico_2009_f9']
    },
    robben: {
      name: 'Arjen Robben',
      concepts: ['inverted_winger', 'counter_attack_trigger'],
      examples: ['bayern_2013_iw'] // inverted winger example
    },
    salah: {
      name: 'Mohamed Salah',
      concepts: ['inverted_winger', 'high_press', 'counter_attack_trigger'],
      examples: ['liverpool_2018_hp', 'liverpool_2018_f9']
    },
    firmino: {
      name: 'Roberto Firmino',
      concepts: ['false_9', 'high_press', 'pressing_trap'],
      examples: ['liverpool_2018_f9', 'liverpool_2018_hp']
    },
    fabregas: {
      name: 'Cesc Fàbregas',
      concepts: ['false_9', 'midfield_overload'],
      examples: ['spain_2012_f9']
    },
    totti: {
      name: 'Francesco Totti',
      concepts: ['false_9'],
      examples: ['roma_2007_f9']
    }
  };

  // Coach tactical profiles
  private coachProfiles: Record<string, CoachTacticalProfile> = {
    guardiola: {
      name: 'Pep Guardiola',
      concepts: ['false_9', 'midfield_overload', 'third_man_run'],
      examples: ['barcelona_2009_f9', 'barca_clasico_2009_f9', 'city_2023_mo', 'city_2020_hp', 'city_2021_pt']
    },
    klopp: {
      name: 'Jürgen Klopp',
      concepts: ['high_press', 'pressing_trap', 'compactness_pressing_lines'],
      examples: ['liverpool_2018_hp', 'dortmund_2012_hp', 'liverpool_2019_hp', 'dortmund_2013_pt', 'liverpool_2018_f9']
    },
    simeone: {
      name: 'Diego Simeone',
      concepts: ['defensive_block', 'compactness_pressing_lines'],
      examples: ['atletico_2014_db', 'atletico_2020_db']
    },
    mourinho: {
      name: 'José Mourinho',
      concepts: ['defensive_block', 'pressing_trap'],
      examples: ['inter_2010_db', 'inter_2010_pt']
    }
  };

  // Concept-to-Match Graph
  private conceptMatchGraph: Record<string, ConceptGraphNode> = {
    false_9: {
      conceptId: 'false_9',
      historicalMatches: ['barcelona_2009_f9', 'spain_2012_f9', 'barca_clasico_2009_f9', 'roma_2007_f9', 'liverpool_2018_f9'],
      historicalBreakdowns: ['barcelona_2009_f9', 'spain_2012_f9', 'barca_clasico_2009_f9', 'roma_2007_f9', 'liverpool_2018_f9'],
      keyPlayers: ['Lionel Messi', 'Cesc Fàbregas', 'Francesco Totti', 'Roberto Firmino'],
      keyCoaches: ['Pep Guardiola', 'Vicente del Bosque', 'Luciano Spalletti', 'Jürgen Klopp']
    },
    high_press: {
      conceptId: 'high_press',
      historicalMatches: ['liverpool_2018_hp', 'dortmund_2012_hp', 'city_2020_hp', 'bayern_2020_hp', 'liverpool_2019_hp'],
      historicalBreakdowns: ['liverpool_2018_hp', 'dortmund_2012_hp', 'city_2020_hp', 'bayern_2020_hp', 'liverpool_2019_hp'],
      keyPlayers: ['Roberto Firmino', 'Mohamed Salah', 'Sadio Mané', 'Robert Lewandowski', 'Shinji Kagawa'],
      keyCoaches: ['Jürgen Klopp', 'Pep Guardiola', 'Hansi Flick']
    },
    pressing_trap: {
      conceptId: 'pressing_trap',
      historicalMatches: ['inter_2010_pt', 'southampton_2016_pt', 'city_2021_pt', 'dortmund_2013_pt', 'leeds_2022_pt'],
      historicalBreakdowns: ['inter_2010_pt', 'southampton_2016_pt', 'city_2021_pt', 'dortmund_2013_pt', 'leeds_2022_pt'],
      keyPlayers: ['Esteban Cambiasso', 'Tyler Adams', 'Oriol Romeu', 'Kyle Walker'],
      keyCoaches: ['José Mourinho', 'Claude Puel', 'Pep Guardiola', 'Jürgen Klopp', 'Jesse Marsch']
    },
    defensive_block: {
      conceptId: 'defensive_block',
      historicalMatches: ['atletico_2014_db', 'chelsea_2012_db', 'inter_2010_db', 'celtic_2012_db', 'atletico_2020_db'],
      historicalBreakdowns: ['atletico_2014_db', 'chelsea_2012_db', 'inter_2010_db', 'celtic_2012_db', 'atletico_2020_db'],
      keyPlayers: ['Diego Godín', 'Javier Zanetti', 'John Terry', 'Victor Wanyama'],
      keyCoaches: ['Diego Simeone', 'Roberto Di Matteo', 'José Mourinho', 'Neil Lennon']
    },
    midfield_overload: {
      conceptId: 'midfield_overload',
      historicalMatches: ['city_2023_mo', 'spain_2012_f9'],
      historicalBreakdowns: ['city_2023_mo', 'spain_2012_f9'],
      keyPlayers: ['John Stones', 'Rodri', 'Kevin De Bruyne', 'Cesc Fàbregas'],
      keyCoaches: ['Pep Guardiola', 'Vicente del Bosque']
    },
    third_man_run: {
      conceptId: 'third_man_run',
      historicalMatches: ['city_2023_mo'],
      historicalBreakdowns: ['city_2023_mo'],
      keyPlayers: ['Kevin De Bruyne', 'Lionel Messi'],
      keyCoaches: ['Pep Guardiola']
    },
    inverted_winger: {
      conceptId: 'inverted_winger',
      historicalMatches: ['bayern_2013_iw'],
      historicalBreakdowns: ['bayern_2013_iw'],
      keyPlayers: ['Arjen Robben', 'Mohamed Salah'],
      keyCoaches: ['Jupp Heynckes', 'Jürgen Klopp']
    },
    back_three_wing_back: {
      conceptId: 'back_three_wing_back',
      historicalMatches: ['spain_2012_f9'],
      historicalBreakdowns: ['spain_2012_f9'],
      keyPlayers: ['Jordi Alba', 'Cesc Fàbregas'],
      keyCoaches: ['Vicente del Bosque']
    },
    compactness_pressing_lines: {
      conceptId: 'compactness_pressing_lines',
      historicalMatches: ['atletico_2014_db', 'atletico_2020_db'],
      historicalBreakdowns: ['atletico_2014_db', 'atletico_2020_db'],
      keyPlayers: ['Diego Godín', 'Koke'],
      keyCoaches: ['Diego Simeone']
    },
    counter_attack_trigger: {
      conceptId: 'counter_attack_trigger',
      historicalMatches: ['liverpool_2018_hp', 'dortmund_2012_hp'],
      historicalBreakdowns: ['liverpool_2018_hp', 'dortmund_2012_hp'],
      keyPlayers: ['Mohamed Salah', 'Sadio Mané', 'Robert Lewandowski'],
      keyCoaches: ['Jürgen Klopp']
    }
  };

  private constructor() {}

  public static getInstance(): ClassroomIntentEngine {
    if (!ClassroomIntentEngine.instance) {
      ClassroomIntentEngine.instance = new ClassroomIntentEngine();
    }
    return ClassroomIntentEngine.instance;
  }

  public getPlayerProfile(name: string): PlayerTacticalProfile | undefined {
    return this.playerProfiles[name.toLowerCase()];
  }

  public getCoachProfile(name: string): CoachTacticalProfile | undefined {
    // Standardize naming checks
    const key = name.toLowerCase();
    if (key.includes('pep') || key.includes('guardiola')) return this.coachProfiles.guardiola;
    if (key.includes('klopp')) return this.coachProfiles.klopp;
    if (key.includes('simeone')) return this.coachProfiles.simeone;
    if (key.includes('mourinho')) return this.coachProfiles.mourinho;
    return this.coachProfiles[key];
  }

  public getConceptGraphNode(conceptId: string): ConceptGraphNode | undefined {
    return this.conceptMatchGraph[conceptId];
  }

  /**
   * Classifies query intent and returns the resolved target concept & action payloads.
   */
  public classifyIntent(
    question: string,
    context: ConversationContext
  ): IntentEvaluationResult {
    const q = question.toLowerCase();
    let intent: ClassroomIntent = 'CONCEPT_EXPLANATION';
    let confidence = 0.60;

    // Evaluate transition outcome using the chain engine
    const transitionOutcome = conceptChainEngine.evaluateTransition(question, context);
    let matchedConceptId = transitionOutcome.conceptId || context.active_concept || undefined;
    if (transitionOutcome.isTransition) {
      confidence = 0.90;
    }

    const actions: ClassroomAction[] = [];

    // Helper: Detect specific concepts from query
    const explicitConcept = conceptVocabularyService.detectConceptFromQuery(q);
    if (explicitConcept) {
      matchedConceptId = explicitConcept;
      confidence = 0.85;
    }

    // 1. Detect PLAYER_EXAMPLE
    const playerKeys = Object.keys(this.playerProfiles);
    const matchedPlayerKey = playerKeys.find((pk) => q.includes(pk));

    if (matchedPlayerKey) {
      intent = 'PLAYER_EXAMPLE';
      confidence = 0.95;
      const profile = this.playerProfiles[matchedPlayerKey];
      // Resolve concept from profile
      if (profile.concepts.length > 0 && (!matchedConceptId || !profile.concepts.includes(matchedConceptId))) {
        matchedConceptId = profile.concepts[0];
      }

      // Add breakdown and match action cards
      profile.examples.forEach((exId) => {
        const example = historicalExampleRepository.getById(exId);
        if (example) {
          actions.push({
            type: 'LAUNCH_HISTORICAL_BREAKDOWN',
            label: `Launch Breakdown: ${example.match_name} (${profile.name} focus)`,
            payload: {
              concept_id: example.concept_id,
              example_id: exId,
              breakdown_id: exId
            }
          });
        }
      });
    }

    // 2. Detect COACH_EXAMPLE
    else if (q.includes('guardiola') || q.includes('pep') || q.includes('klopp') || q.includes('simeone') || q.includes('mourinho')) {
      intent = 'COACH_EXAMPLE';
      confidence = 0.95;
      const coachName = q.includes('guardiola') || q.includes('pep') ? 'guardiola' :
                        q.includes('klopp') ? 'klopp' :
                        q.includes('simeone') ? 'simeone' : 'mourinho';
      const profile = this.coachProfiles[coachName];

      if (profile.concepts.length > 0 && (!matchedConceptId || !profile.concepts.includes(matchedConceptId))) {
        matchedConceptId = profile.concepts[0];
      }

      const relevantExamples = historicalExampleService.getExamplesByCoach(profile.name);
      relevantExamples.forEach((ex) => {
        actions.push({
          type: 'LAUNCH_MATCH',
          label: `View Match Card: ${ex.match_name}`,
          payload: {
            concept_id: ex.concept_id,
            example_id: ex.example_id
          }
        });
      });
    }

    // 3. Detect MATCH_EXAMPLE / REAL_WORLD_EXAMPLE / HISTORICAL_BREAKDOWN
    else if (q.includes('example') || q.includes('actual match') || q.includes('real match') || q.includes('actual fixture') || q.includes('fixture') || q.includes('game') || q.includes('breakdown')) {
      intent = q.includes('breakdown') ? 'HISTORICAL_BREAKDOWN' : 'REAL_WORLD_EXAMPLE';
      confidence = 0.90;
      
      const conceptId = matchedConceptId || 'false_9';
      const bestExample = historicalExampleService.getBestExample(conceptId);

      if (bestExample) {
        actions.push({
          type: 'LAUNCH_HISTORICAL_BREAKDOWN',
          label: `View Tactical Breakdown: ${bestExample.match_name}`,
          payload: {
            concept_id: conceptId,
            example_id: bestExample.example_id,
            breakdown_id: bestExample.example_id
          }
        });
        actions.push({
          type: 'LAUNCH_MATCH',
          label: `Open Match Card: ${bestExample.match_name}`,
          payload: {
            concept_id: conceptId,
            example_id: bestExample.example_id
          }
        });
      }
    }

    // 4. Detect CONCEPT_CHAIN
    else if (q.includes('next') || q.includes('then what') || q.includes('what happens after') || q.includes('chain')) {
      intent = 'CONCEPT_CHAIN';
      confidence = 0.85;
    }

    // 5. Detect TACTICAL_COMPARISON
    else if (q.includes('difference') || q.includes('compare') || q.includes('versus') || q.includes(' vs ')) {
      intent = 'TACTICAL_COMPARISON';
      confidence = 0.80;
    }

    // Default concept animations if appropriate
    if (matchedConceptId && actions.length === 0) {
      actions.push({
        type: 'LAUNCH_CONCEPT',
        label: `Launch 3D Concept: ${conceptVocabularyService.getSupportedConceptIds().includes(matchedConceptId) ? matchedConceptId.replace(/_/g, ' ') : 'Concept'}`,
        payload: {
          concept_id: matchedConceptId
        }
      });
    }

    // Append related concept actions if available in the graph
    if (matchedConceptId) {
      const graphNode = this.conceptMatchGraph[matchedConceptId];
      if (graphNode) {
        // Expose a related concept link
        const concept = conceptVocabularyService.getSupportedConceptIds().find(id => id !== matchedConceptId && graphNode.keyCoaches.some(c => this.coachProfiles[c.split(' ')[1]?.toLowerCase()]?.concepts.includes(id)));
        if (concept) {
          actions.push({
            type: 'OPEN_RELATED_CONCEPT',
            label: `Explore Related: ${concept.replace(/_/g, ' ')}`,
            payload: {
              concept_id: concept
            }
          });
        }
      }
    }

    return {
      intent,
      confidence,
      matchedConceptId,
      actions
    };
  }
}

export const classroomIntentEngine = ClassroomIntentEngine.getInstance();
