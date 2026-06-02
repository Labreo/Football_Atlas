import { animationModuleRegistry } from './registry';

export class ConceptRouter {
  /**
   * Resolves concept_id into the corresponding animation module key in the registry.
   */
  public static resolveAnimationModule(conceptId: string): string | null {
    const isRegistered = animationModuleRegistry.getModule(conceptId) !== undefined;
    if (isRegistered) {
      return conceptId;
    }
    return null;
  }
}
