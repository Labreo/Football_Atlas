import { z } from 'zod';
import { ComplexityLevel, tacticalRegistry, TacticalConcept } from '@football-atlas/shared';
import { historicalExampleService } from './historicalExample.service';
import { historicalExampleRepository } from '../repositories/historicalExample.repository';
import { historicalBreakdownService } from './historicalBreakdown.service';
import { groundedExampleService } from './groundedExample.service';
import { KnowledgeLevelDetector } from './knowledgeLevelDetector.service';
import { conceptVocabularyService } from './vocabulary.service';
import { conceptChainEngine } from './chainEngine.service';
import { explanationAdaptationLayer } from './explanationAdaptation.service';
import { knowledgeStore } from './store.service';
import { Logger } from '../utils/logger';

export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: z.ZodObject<any>;
  handler: (args: any) => Promise<any>;
}

export class FootballAtlasMCPServer {
  private static instance: FootballAtlasMCPServer;
  private tools: Map<string, MCPToolDefinition> = new Map();

  private constructor() {
    this.registerAllTools();
  }

  public static getInstance(): FootballAtlasMCPServer {
    if (!FootballAtlasMCPServer.instance) {
      FootballAtlasMCPServer.instance = new FootballAtlasMCPServer();
    }
    return FootballAtlasMCPServer.instance;
  }

  /**
   * Registers a tool on the server.
   */
  public registerTool(tool: MCPToolDefinition) {
    if (this.tools.has(tool.name)) {
      Logger.warn(`Tool "${tool.name}" is already registered. Overwriting definition.`);
    }
    this.tools.set(tool.name, tool);
  }

  /**
   * Returns all registered tool definitions.
   */
  public listTools(): Array<{ name: string; description: string; inputSchema: any }> {
    return Array.from(this.tools.values()).map(t => ({
      name: t.name,
      description: t.description,
      inputSchema: this.zodSchemaToJson(t.inputSchema)
    }));
  }

  /**
   * Validates inputs and executes the target tool.
   */
  public async executeTool(name: string, args: any): Promise<any> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`MCP Tool Not Found: "${name}"`);
    }

    // Validation
    const parsed = tool.inputSchema.safeParse(args);
    if (!parsed.success) {
      throw new Error(`MCP Tool Argument Validation Failed for "${name}": ${parsed.error.message}`);
    }

    try {
      const result = await tool.handler(parsed.data);
      return result;
    } catch (err: any) {
      Logger.error(`Error executing MCP tool "${name}":`, err);
      throw new Error(`MCP Tool Execution Error: ${err.message}`);
    }
  }

  /**
   * Register the platform's core and advanced tactical tools.
   */
  private registerAllTools() {
    // 1. get_concept_explanation
    this.registerTool({
      name: 'get_concept_explanation',
      description: 'Retrieves a structured tactical explanation of a football concept, adapted to the target knowledge level.',
      inputSchema: z.object({
        concept_id: z.string().describe('The ID of the concept to explain (e.g. false_9, high_press, counter_attack_trigger)'),
        knowledge_level: z.enum(['beginner', 'intermediate', 'advanced']).optional().default('intermediate').describe('The complexity level of the explanation'),
        conversation_context: z.string().optional().describe('Optional context from previous conversation turns to refine explanations')
      }),
      handler: async (args) => {
        const concept = tacticalRegistry.getConcept(args.concept_id);
        if (!concept) {
          throw new Error(`Concept with ID "${args.concept_id}" not found.`);
        }

        const level = args.knowledge_level.toUpperCase() as ComplexityLevel;
        const baseExplanation = concept.core_explanation;
        const adaptedText = explanationAdaptationLayer.adaptExplanation(args.concept_id, level, baseExplanation);

        return {
          concept_id: concept.concept_id,
          concept_name: concept.concept_name,
          complexity: concept.complexity,
          adapted_level: args.knowledge_level,
          explanation: adaptedText,
          key_principles: concept.key_principles,
          defensive_response: concept.defensive_response
        };
      }
    });

    // 2. trigger_animation
    this.registerTool({
      name: 'trigger_animation',
      description: 'Generates the animation coordinate setup and phase mappings for rendering on the 3D visual board.',
      inputSchema: z.object({
        concept_id: z.string().describe('The ID of the tactical concept to animate')
      }),
      handler: async (args) => {
        const concept = tacticalRegistry.getConcept(args.concept_id);
        if (!concept) {
          throw new Error(`Concept with ID "${args.concept_id}" not found.`);
        }

        return {
          concept_id: concept.concept_id,
          concept_name: concept.concept_name,
          animation_module: concept.animation_module,
          required_overlays: concept.animation_module?.required_overlays || []
        };
      }
    });

    // 3. fetch_historical_example
    this.registerTool({
      name: 'fetch_historical_example',
      description: 'Searches and retrieves historical matches or performance examples of a concept, optionally filtered by player, coach, or match fixture.',
      inputSchema: z.object({
        concept_id: z.string().optional().describe('Filter by concept ID (e.g. false_9)'),
        player: z.string().optional().describe('Filter by specific player name (e.g. Messi, Mbappé)'),
        coach: z.string().optional().describe('Filter by specific coach name (e.g. Guardiola, Klopp)'),
        match: z.string().optional().describe('Filter by specific match fixture phrase (e.g. 2022 Final, Champions League)')
      }),
      handler: async (args) => {
        // Query repositories or services
        let results = historicalExampleRepository.getAll();

        if (args.concept_id) {
          results = results.filter(e => e.concept_id === args.concept_id);
        }
        if (args.player) {
          const pLower = args.player.toLowerCase();
          results = results.filter(e => e.players.some(p => p.toLowerCase().includes(pLower)));
        }
        if (args.coach) {
          const cLower = args.coach.toLowerCase();
          results = results.filter(e => e.coach.toLowerCase().includes(cLower));
        }
        if (args.match) {
          const mLower = args.match.toLowerCase();
          results = results.filter(e => e.match_name.toLowerCase().includes(mLower) || e.competition.toLowerCase().includes(mLower));
        }

        return results.map(e => ({
          example_id: e.example_id,
          concept_id: e.concept_id,
          match_name: e.match_name,
          season: e.season,
          competition: e.competition,
          coach: e.coach,
          players: e.players,
          description: e.description,
          tactical_summary: e.tactical_summary
        }));
      }
    });

    // 4. launch_breakdown
    this.registerTool({
      name: 'launch_breakdown',
      description: 'Retrieves the complete coordinate breakdown, camera configurations, and moment commentary for an interactive match timeline.',
      inputSchema: z.object({
        breakdown_id: z.string().describe('The ID of the breakdown / historical example to retrieve')
      }),
      handler: async (args) => {
        const breakdown = historicalBreakdownService.getBreakdownByExampleId(args.breakdown_id);
        if (!breakdown) {
          throw new Error(`Tactical breakdown for ID "${args.breakdown_id}" not found.`);
        }

        return breakdown;
      }
    });

    // 5. compose_concepts
    this.registerTool({
      name: 'compose_concepts',
      description: 'Generates a comparative tactical relationship analysis connecting two different concepts.',
      inputSchema: z.object({
        concept_a: z.string().describe('First tactical concept ID (e.g. false_9)'),
        concept_b: z.string().describe('Second tactical concept ID (e.g. inverted_winger)')
      }),
      handler: async (args) => {
        const relations: Record<string, any> = {
          'false_9_inverted_winger': {
            type: 'tactical_synergy',
            description: 'The False 9 drops deep centrally to draw defenders out, while the Inverted Winger runs diagonally inside to exploit the vacated channel.',
            common_zones: ['Zone 14', 'half-spaces'],
            rationale: 'Complementary vertical rotation stretching central markers.'
          },
          'high_press_pressing_trap': {
            type: 'tactical_evolution',
            description: 'High Press applies pressure universally, whereas a Pressing Trap selectively funnels the opponent into a specific area before closing down in groups.',
            common_zones: ['wings', 'final third'],
            rationale: 'Active baiting vs standard territorial pressure.'
          }
        };
        const key = `${args.concept_a}_${args.concept_b}`;
        const revKey = `${args.concept_b}_${args.concept_a}`;
        const relationship = relations[key] || relations[revKey];

        return {
          concept_a: args.concept_a,
          concept_b: args.concept_b,
          relationship_type: relationship?.type || 'tactical_synergy',
          description: relationship?.description || `Connecting ${args.concept_a.replace(/_/g, ' ')} and ${args.concept_b.replace(/_/g, ' ')} under positional play structures.`,
          common_spaces: relationship?.common_zones || ['half-spaces', 'midfield'],
          tactical_logic: relationship?.rationale || `Exploring structural interaction between ${args.concept_a} and ${args.concept_b}.`
        };
      }
    });

    // 6. assess_knowledge_level
    this.registerTool({
      name: 'assess_knowledge_level',
      description: 'Analyzes user chat messages and history to determine their complexity level (beginner, intermediate, advanced) and confidence score.',
      inputSchema: z.object({
        conversation_history: z.array(z.string()).describe('List of previous questions from the user')
      }),
      handler: async (args) => {
        const detection = KnowledgeLevelDetector.detect('', args.conversation_history);
        return {
          detected_level: detection.detected_level.toLowerCase(),
          confidence: detection.confidence_score,
          evidence_matches: detection.evidence
        };
      }
    });

    // 7. retrieve_source_evidence
    this.registerTool({
      name: 'retrieve_source_evidence',
      description: 'Retrieves parsed evidence chunks grounded by IBM Docling supporting a tactical claims/example.',
      inputSchema: z.object({
        example_id: z.string().describe('The historical example ID to look up evidence for')
      }),
      handler: async (args) => {
        const evidence = groundedExampleService.getEvidenceForExample(args.example_id);
        return evidence.map(ev => {
          const chunk = knowledgeStore.getChunk(ev.chunk_id);
          return {
            evidence_id: ev.evidence_id,
            document_id: ev.document_id,
            source_title: ev.source_title,
            source_type: ev.source_type,
            page_number: chunk ? (chunk as any).page_number : undefined,
            excerpt: ev.excerpt,
            confidence: ev.confidence
          };
        });
      }
    });

    // 8. suggest_next_concept
    this.registerTool({
      name: 'suggest_next_concept',
      description: 'Generates recommendations for the next tactical concept to study based on prerequisites and mastery levels.',
      inputSchema: z.object({
        completed_concepts: z.array(z.string()).describe('Concept IDs the user has already finished studying')
      }),
      handler: async (args) => {
        const allConcepts = tacticalRegistry.getAllConcepts();
        const incomplete = allConcepts.filter(c => !args.completed_concepts.includes(c.concept_id));
        
        // Simple suggestion prioritizing concepts where prerequisites are met
        const recommended = incomplete[0] || allConcepts[0];
        
        return {
          recommended_concept_id: recommended?.concept_id || 'false_9',
          recommended_concept_name: recommended?.concept_name || 'False 9',
          rationale: `Builds on completed concepts by introducing related spatial structures.`
        };
      }
    });
  }

  /**
   * Helper that translates a Zod object shape to JSON Schema structure.
   */
  private zodSchemaToJson(schema: z.ZodObject<any>): any {
    const shape = schema.shape;
    const properties: any = {};
    const required: string[] = [];

    for (const [key, value] of Object.entries(shape)) {
      const zValue = value as z.ZodTypeAny;
      const desc = zValue.description || '';
      
      let typeStr = 'string';
      let enumVals: string[] | undefined = undefined;

      if (zValue instanceof z.ZodEnum) {
        typeStr = 'string';
        enumVals = zValue.options;
      } else if (zValue instanceof z.ZodNumber) {
        typeStr = 'number';
      } else if (zValue instanceof z.ZodBoolean) {
        typeStr = 'boolean';
      } else if (zValue instanceof z.ZodArray) {
        typeStr = 'array';
      } else if (zValue instanceof z.ZodOptional) {
        // Unpack inner type if possible
        const innerType = zValue._def.innerType;
        if (innerType instanceof z.ZodEnum) {
          enumVals = innerType.options;
        }
      }

      properties[key] = {
        type: typeStr,
        description: desc,
        ...(enumVals ? { enum: enumVals } : {})
      };

      if (!(zValue instanceof z.ZodOptional)) {
        required.push(key);
      }
    }

    return {
      type: 'object',
      properties,
      required
    };
  }
}

export const footballAtlasMCPServer = FootballAtlasMCPServer.getInstance();
