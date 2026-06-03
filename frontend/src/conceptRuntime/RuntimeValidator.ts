import {
  RuntimeHealthReport,
  ConceptHealthStatus,
  tacticalRegistry,
} from '@football-atlas/shared';
import { conceptLoader } from './ConceptLoader';
import { animationModuleRegistry } from '../tacticalOrchestrator/registry';

// ────────────────────────────────────────────────────────────
// RUNTIME VALIDATOR
// Verifies the entire runtime is correctly wired after boot.
// ────────────────────────────────────────────────────────────

export class RuntimeValidator {

  /**
   * Runs a full health check on all loaded concept packages.
   */
  public validate(): RuntimeHealthReport {
    const startTime = performance.now();
    const manifests = conceptLoader.getLoadedManifests();
    const conceptStatuses: ConceptHealthStatus[] = [];
    let validCount = 0;
    let invalidCount = 0;

    for (const manifest of manifests) {
      const status = this.validateConcept(manifest.concept_id);
      conceptStatuses.push(status);

      if (status.errors.length === 0) {
        validCount++;
      } else {
        invalidCount++;
      }
    }

    const bootTime = Math.round(performance.now() - startTime);

    const report: RuntimeHealthReport = {
      total_concepts: manifests.length,
      valid_concepts: validCount,
      invalid_concepts: invalidCount,
      concepts: conceptStatuses,
      boot_time_ms: bootTime,
      timestamp: new Date().toISOString(),
    };

    // Log summary
    const status = invalidCount === 0 ? '✅' : '⚠️';
    console.log(
      `[RuntimeValidator] ${status} Health: ${validCount}/${manifests.length} concepts valid (${bootTime}ms)`
    );

    if (invalidCount > 0) {
      console.warn(
        `[RuntimeValidator] ${invalidCount} concept(s) have issues:`,
        conceptStatuses
          .filter((s) => s.errors.length > 0)
          .map((s) => ({ id: s.concept_id, errors: s.errors }))
      );
    }

    return report;
  }

  /**
   * Validates a single concept by its ID across all layers.
   */
  private validateConcept(conceptId: string): ConceptHealthStatus {
    const errors: string[] = [];

    // 1. Check manifest exists in loader
    const manifest = conceptLoader.getManifest(conceptId);
    const manifestValid = !!manifest;
    if (!manifestValid) {
      errors.push('Manifest not found in ConceptLoader');
    }

    // 2. Check animation module is registered
    const moduleRegistered = animationModuleRegistry.getModule(conceptId) !== undefined;
    if (!moduleRegistered) {
      errors.push('Animation module not registered in AnimationModuleRegistry');
    }

    // 3. Check vocabulary is present in the package
    const pkg = conceptLoader.getPackage(conceptId);
    const vocabPresent = !!(
      pkg &&
      pkg.vocabulary &&
      Object.keys(pkg.vocabulary).length > 0 &&
      pkg.vocabulary['en']?.length > 0
    );
    if (!vocabPresent) {
      errors.push('No English vocabulary keywords found');
    }

    // 4. Check seed data exists in TacticalRegistry
    let seedExists = false;
    try {
      seedExists = tacticalRegistry.getConcept(conceptId) !== undefined;
    } catch (_) {
      seedExists = false;
    }
    if (!seedExists) {
      errors.push('No seed data found in TacticalRegistry');
    }

    // 5. Check all prerequisites exist as loaded concepts
    let prerequisitesSatisfied = true;
    if (manifest) {
      const prereqs = manifest.teaching_metadata.prerequisites;
      for (const prereq of prereqs) {
        if (!conceptLoader.isLoaded(prereq)) {
          prerequisitesSatisfied = false;
          errors.push(`Prerequisite "${prereq}" is not loaded`);
        }
      }
    }

    return {
      concept_id: conceptId,
      manifest_valid: manifestValid,
      module_loadable: moduleRegistered,
      vocabulary_present: vocabPresent,
      seed_exists: seedExists,
      prerequisites_satisfied: prerequisitesSatisfied,
      errors,
    };
  }
}

export const runtimeValidator = new RuntimeValidator();
