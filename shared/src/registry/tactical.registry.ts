import { TacticalConcept } from '../types/tactical';
import { TacticalCategory, ComplexityLevel } from '../enums/tactical.enums';
import { allSeeds } from '../seed/tactical.seed';
import { TacticalConceptSchema } from '../schemas/tactical.schemas';

export class TacticalRegistry {
  private static instance: TacticalRegistry;
  private registry: Map<string, TacticalConcept> = new Map();

  private constructor() {
    // Automatically load static seed database upon instantiation
    allSeeds.forEach(concept => this.registerConcept(concept));
  }

  /**
   * Retrieves the global registry singleton instance.
   */
  public static getInstance(): TacticalRegistry {
    if (!TacticalRegistry.instance) {
      TacticalRegistry.instance = new TacticalRegistry();
    }
    return TacticalRegistry.instance;
  }

  /**
   * Registers a new concept schema, running Zod validation at runtime.
   * Throws error if validation fails.
   */
  public registerConcept(concept: TacticalConcept): void {
    const validationResult = TacticalConceptSchema.safeParse(concept);
    
    if (!validationResult.success) {
      const details = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(' | ');
      throw new Error(`[Registry Error] Schema validation failed for concept "${concept.concept_id}": ${details}`);
    }

    this.registry.set(concept.concept_id, validationResult.data);
  }

  /**
   * Looks up a single concept by unique ID.
   */
  public getConcept(conceptId: string): TacticalConcept | undefined {
    return this.registry.get(conceptId);
  }

  /**
   * Resolves first-degree related concepts from the registry graph.
   */
  public getRelatedConcepts(conceptId: string): TacticalConcept[] {
    const concept = this.getConcept(conceptId);
    if (!concept) return [];
    
    return concept.related_concepts
      .map(id => this.getConcept(id))
      .filter((c): c is TacticalConcept => c !== undefined);
  }

  /**
   * Filters the playbook by category.
   */
  public getConceptsByCategory(category: TacticalCategory): TacticalConcept[] {
    return Array.from(this.registry.values()).filter(c => c.category === category);
  }

  /**
   * Filters the playbook by difficulty level.
   */
  public getConceptsByComplexity(level: ComplexityLevel): TacticalConcept[] {
    return Array.from(this.registry.values()).filter(c => c.complexity === level);
  }

  /**
   * Returns all registered concepts.
   */
  public getAllConcepts(): TacticalConcept[] {
    return Array.from(this.registry.values());
  }

  /**
   * Clears all registered concepts.
   */
  public clear(): void {
    this.registry.clear();
  }
}

// Global exported registry singleton instance
export const tacticalRegistry = TacticalRegistry.getInstance();
