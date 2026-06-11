import { TacticalModule } from '../tacticalEngine/module';
import { TacticalAnimationEngine } from '../tacticalEngine/engine';

/**
 * AnimationModuleRegistry
 * 
 * Manages the lifecycle of tactical animation modules.
 * Modules are registered dynamically by the ConceptLoader during runtime boot —
 * no hardcoded imports needed. Adding a new concept never requires editing this file.
 */
export class AnimationModuleRegistry {
  private static instance: AnimationModuleRegistry;
  private modules: Map<string, new () => TacticalModule> = new Map();
  private activeInstances: Map<string, TacticalModule> = new Map();

  private constructor() {
    // Empty constructor — modules are registered dynamically by ConceptLoader.
  }

  public static getInstance(): AnimationModuleRegistry {
    if (!AnimationModuleRegistry.instance) {
      AnimationModuleRegistry.instance = new AnimationModuleRegistry();
    }
    return AnimationModuleRegistry.instance;
  }

  public registerModule(conceptId: string, moduleClass: new () => TacticalModule): void {
    this.modules.set(conceptId, moduleClass);
  }

  public getModule(conceptId: string): (new () => TacticalModule) | undefined {
    return this.modules.get(conceptId);
  }

  public loadModule(conceptId: string, engine: TacticalAnimationEngine): TacticalModule {
    this.unloadModule(conceptId);

    const ModuleClass = this.getModule(conceptId);
    if (!ModuleClass) {
      throw new Error(`[Registry Error] No animation module registered for concept ID "${conceptId}"`);
    }

    const instance = new ModuleClass();
    instance.init(engine);
    this.activeInstances.set(conceptId, instance);
    return instance;
  }

  public unloadModule(conceptId: string): void {
    const instance = this.activeInstances.get(conceptId);
    if (instance) {
      instance.destroy();
      this.activeInstances.delete(conceptId);
    }
  }

  /**
   * Returns all registered concept IDs (for health checks).
   */
  public getRegisteredIds(): string[] {
    return Array.from(this.modules.keys());
  }

  public clear(): void {
    Array.from(this.activeInstances.keys()).forEach(id => this.unloadModule(id));
    this.activeInstances.clear();
  }
}

export const animationModuleRegistry = AnimationModuleRegistry.getInstance();

