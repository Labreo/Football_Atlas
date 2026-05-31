import { languageDetectionService } from '../services/language-detection.service';
import { conceptVocabularyService } from '../services/vocabulary.service';

export class EnrichmentService {
  /**
   * Scans text content, detects language, and tags matched tactical concepts.
   */
  public detectConcepts(content: string, detectedLanguage?: string): string[] {
    const detected: string[] = [];

    // 1. Detect language if not provided
    const langCode = detectedLanguage || languageDetectionService.detectLanguage(content).language;

    // 2. Fetch language-specific rules
    const rules = conceptVocabularyService.getRegexesForLanguage(langCode);

    for (const rule of rules) {
      const isMatched = rule.regexes.some((regex) => regex.test(content));
      if (isMatched) {
        detected.push(rule.conceptId);
      }
    }

    // 3. Fallback: Check other languages if no matches were found in primary language.
    // This allows detecting loanwords (e.g. "Gegenpressing" in English literature).
    if (detected.length === 0) {
      const allLanguages = ['en', 'de', 'es', 'fr', 'it'];
      for (const lang of allLanguages) {
        if (lang === langCode) continue;
        
        const fallbackRules = conceptVocabularyService.getRegexesForLanguage(lang);
        for (const rule of fallbackRules) {
          if (detected.includes(rule.conceptId)) continue;
          
          const isMatched = rule.regexes.some((regex) => regex.test(content));
          if (isMatched) {
            detected.push(rule.conceptId);
          }
        }
      }
    }

    return detected;
  }
}

export const enrichmentService = new EnrichmentService();
