import { ConceptPackage, ConceptManifest } from '@football-atlas/shared';
import { ConceptManifestSchema } from '@football-atlas/shared';

// ────────────────────────────────────────────────────────────
// CONCEPT VALIDATOR
// Validates concept packages before they enter the registry.
// ────────────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class ConceptValidator {

  /**
   * Full validation of a ConceptPackage.
   * Checks manifest schema, module interface, and vocabulary presence.
   */
  public validate(pkg: ConceptPackage): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Validate manifest against Zod schema
    const schemaResult = this.validateManifest(pkg.manifest);
    errors.push(...schemaResult.errors);
    warnings.push(...schemaResult.warnings);

    // 2. Validate module class has required interface methods
    const moduleResult = this.validateModuleClass(pkg.moduleClass, pkg.manifest.concept_id);
    errors.push(...moduleResult.errors);
    warnings.push(...moduleResult.warnings);

    // 3. Validate vocabulary
    const vocabResult = this.validateVocabulary(pkg.vocabulary, pkg.manifest.concept_id);
    errors.push(...vocabResult.errors);
    warnings.push(...vocabResult.warnings);

    // 4. Cross-validate manifest and vocabulary consistency
    const crossResult = this.crossValidate(pkg);
    errors.push(...crossResult.errors);
    warnings.push(...crossResult.warnings);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validates the manifest object against the ConceptManifestSchema.
   */
  public validateManifest(manifest: ConceptManifest): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const result = ConceptManifestSchema.safeParse(manifest);
    if (!result.success) {
      result.error.errors.forEach((e: any) => {
        errors.push(`[Manifest] ${e.path.join('.')}: ${e.message}`);
      });
    }

    // Warn on empty related_concepts
    if (manifest.related_concepts && manifest.related_concepts.length === 0) {
      warnings.push(`[Manifest] "${manifest.concept_id}" has no related_concepts — consider adding connections for the concept graph.`);
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Validates that the module class has the required TacticalModule interface methods.
   */
  public validateModuleClass(moduleClass: new () => any, conceptId: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!moduleClass) {
      errors.push(`[Module] "${conceptId}" has no moduleClass defined.`);
      return { valid: false, errors, warnings };
    }

    // Check that it's a constructor function
    if (typeof moduleClass !== 'function') {
      errors.push(`[Module] "${conceptId}" moduleClass is not a constructor function.`);
      return { valid: false, errors, warnings };
    }

    // Instantiate to check interface (safely)
    try {
      const instance = new moduleClass();
      const requiredMethods = ['init', 'play', 'pause', 'reset', 'destroy', 'getMetadata'];

      for (const method of requiredMethods) {
        if (typeof instance[method] !== 'function') {
          errors.push(`[Module] "${conceptId}" is missing required method: ${method}()`);
        }
      }

      // Check optional but recommended methods
      const optionalMethods = ['getPhaseStarts', 'setBranch', 'getDebugMetrics'];
      for (const method of optionalMethods) {
        if (typeof instance[method] !== 'function') {
          warnings.push(`[Module] "${conceptId}" does not implement optional method: ${method}()`);
        }
      }

      // Clean up the test instance
      if (typeof instance.destroy === 'function') {
        try { instance.destroy(); } catch (_) {}
      }
    } catch (err: any) {
      errors.push(`[Module] "${conceptId}" moduleClass constructor threw: ${err.message}`);
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Validates that vocabulary has at least English keywords.
   */
  public validateVocabulary(vocabulary: Record<string, string[]>, conceptId: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!vocabulary || Object.keys(vocabulary).length === 0) {
      errors.push(`[Vocabulary] "${conceptId}" has no vocabulary keywords defined.`);
      return { valid: false, errors, warnings };
    }

    if (!vocabulary['en'] || vocabulary['en'].length === 0) {
      errors.push(`[Vocabulary] "${conceptId}" is missing English ('en') keywords — required for Granite mapping.`);
    }

    // Check for very short keyword lists
    const enCount = vocabulary['en']?.length || 0;
    if (enCount > 0 && enCount < 2) {
      warnings.push(`[Vocabulary] "${conceptId}" has only ${enCount} English keyword(s) — consider adding more for better Granite detection.`);
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Cross-validates consistency between manifest fields and vocabulary.
   */
  private crossValidate(pkg: ConceptPackage): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const id = pkg.manifest.concept_id;

    // Ensure manifest granite_keywords match vocabulary
    const manifestKeyLangs = Object.keys(pkg.manifest.granite_keywords || {});
    const vocabLangs = Object.keys(pkg.vocabulary || {});

    if (manifestKeyLangs.length > 0 && vocabLangs.length > 0) {
      const missingInVocab = manifestKeyLangs.filter((l) => !vocabLangs.includes(l));
      if (missingInVocab.length > 0) {
        warnings.push(`[CrossValidation] "${id}" manifest.granite_keywords has languages [${missingInVocab.join(', ')}] not present in vocabulary.`);
      }
    }

    // Validate estimated duration is reasonable
    if (pkg.manifest.estimated_duration_seconds < 3) {
      warnings.push(`[CrossValidation] "${id}" has a very short estimated duration (${pkg.manifest.estimated_duration_seconds}s).`);
    }

    return { valid: errors.length === 0, errors, warnings };
  }
}

export const conceptValidator = new ConceptValidator();
