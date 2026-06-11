import { animationModuleRegistry } from './registry';
import { useBreakdownStore } from '../stores/useBreakdownStore';

export class ConceptRouter {
  /**
   * Resolves concept_id into the corresponding animation module key in the registry.
   */
  public static resolveAnimationModule(conceptId: string): string | null {
    const currentExample = useBreakdownStore.getState().currentExample;
    if (currentExample && currentExample.example_id === 'argentina_france_2022_equaliser') {
      return 'argentina_france_2022_equaliser';
    }

    const isRegistered = animationModuleRegistry.getModule(conceptId) !== undefined;
    if (isRegistered) {
      return conceptId;
    }
    return null;
  }
}
