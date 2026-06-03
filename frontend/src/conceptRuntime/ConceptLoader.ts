import { ConceptPackage, ConceptManifest } from '@football-atlas/shared';
import { conceptValidator, ValidationResult } from './ConceptValidator';
import { animationModuleRegistry } from '../tacticalOrchestrator/registry';

// ────────────────────────────────────────────────────────────
// CONCEPT LOADER
// Auto-discovers, validates, and registers concept packages.
// ────────────────────────────────────────────────────────────

export interface LoadReport {
  total: number;
  loaded: number;
  rejected: number;
  results: Array<{
    concept_id: string;
    status: 'loaded' | 'rejected';
    validation: ValidationResult;
    load_time_ms: number;
  }>;
  total_time_ms: number;
}

export class ConceptLoader {
  private packages: Map<string, ConceptPackage> = new Map();
  private loadReport: LoadReport | null = null;

  /**
   * Loads all concept packages — validates each one and registers
   * valid modules into the AnimationModuleRegistry.
   */
  public loadAll(packages: ConceptPackage[]): LoadReport {
    const startTime = performance.now();
    const results: LoadReport['results'] = [];
    let loaded = 0;
    let rejected = 0;

    for (const pkg of packages) {
      const pkgStart = performance.now();
      const validation = conceptValidator.validate(pkg);
      const pkgTime = Math.round(performance.now() - pkgStart);

      if (validation.valid) {
        this.registerPackage(pkg);
        loaded++;
        results.push({
          concept_id: pkg.manifest.concept_id,
          status: 'loaded',
          validation,
          load_time_ms: pkgTime,
        });
      } else {
        rejected++;
        results.push({
          concept_id: pkg.manifest.concept_id,
          status: 'rejected',
          validation,
          load_time_ms: pkgTime,
        });

        // Log rejection details
        console.warn(
          `[ConceptLoader] ❌ Rejected "${pkg.manifest.concept_id}":`,
          validation.errors
        );
      }

      // Log warnings even for valid packages
      if (validation.warnings.length > 0) {
        console.info(
          `[ConceptLoader] ⚠️ Warnings for "${pkg.manifest.concept_id}":`,
          validation.warnings
        );
      }
    }

    const totalTime = Math.round(performance.now() - startTime);

    this.loadReport = {
      total: packages.length,
      loaded,
      rejected,
      results,
      total_time_ms: totalTime,
    };

    console.log(
      `[ConceptLoader] ✅ Loaded ${loaded}/${packages.length} packages in ${totalTime}ms` +
        (rejected > 0 ? ` (${rejected} rejected)` : '')
    );

    return this.loadReport;
  }

  /**
   * Loads a single concept package dynamically (hot-add).
   */
  public loadPackage(pkg: ConceptPackage): ValidationResult {
    const validation = conceptValidator.validate(pkg);

    if (validation.valid) {
      this.registerPackage(pkg);
      console.log(`[ConceptLoader] ✅ Hot-loaded "${pkg.manifest.concept_id}"`);
    } else {
      console.warn(
        `[ConceptLoader] ❌ Rejected hot-load of "${pkg.manifest.concept_id}":`,
        validation.errors
      );
    }

    return validation;
  }

  /**
   * Registers a validated package into the animation module registry.
   */
  private registerPackage(pkg: ConceptPackage): void {
    const conceptId = pkg.manifest.concept_id;

    // Store the package reference
    this.packages.set(conceptId, pkg);

    // Register the module class into the AnimationModuleRegistry
    animationModuleRegistry.registerModule(conceptId, pkg.moduleClass);
  }

  /**
   * Returns the loaded manifest for a concept ID.
   */
  public getManifest(conceptId: string): ConceptManifest | undefined {
    return this.packages.get(conceptId)?.manifest;
  }

  /**
   * Returns the full package for a concept ID.
   */
  public getPackage(conceptId: string): ConceptPackage | undefined {
    return this.packages.get(conceptId);
  }

  /**
   * Returns all loaded manifests.
   */
  public getLoadedManifests(): ConceptManifest[] {
    return Array.from(this.packages.values()).map((p) => p.manifest);
  }

  /**
   * Returns all loaded concept IDs.
   */
  public getLoadedConceptIds(): string[] {
    return Array.from(this.packages.keys());
  }

  /**
   * Returns the most recent load report.
   */
  public getLoadReport(): LoadReport | null {
    return this.loadReport;
  }

  /**
   * Checks if a concept is loaded.
   */
  public isLoaded(conceptId: string): boolean {
    return this.packages.has(conceptId);
  }

  /**
   * Returns the total number of loaded packages.
   */
  public getLoadedCount(): number {
    return this.packages.size;
  }

  /**
   * Clears all loaded packages.
   */
  public clear(): void {
    this.packages.clear();
    this.loadReport = null;
  }
}

export const conceptLoader = new ConceptLoader();
