// @ts-ignore
import franc from 'franc-min';

// Map franc ISO 639-3 codes → ISO 639-1 2-letter codes for the 5 supported languages
const FRANC_TO_ISO2: Record<string, string> = {
  eng: 'en',
  deu: 'de',
  spa: 'es',
  fra: 'fr',
  ita: 'it',
};

// Supported 2-letter codes (output set)
const SUPPORTED_LANGS = new Set(['en', 'de', 'es', 'fr', 'it']);

export class LanguageDetectionService {
  /**
   * Detects the language of a given text block using the franc library.
   * franc uses trigram frequency analysis — far more accurate than stop-word heuristics.
   * Falls back to 'en' if the text is too short or unrecognized.
   */
  public detectLanguage(text: string): { language: string; confidence: number } {
    const cleanText = text.trim();

    // franc needs at least ~10 chars for reliable detection
    if (cleanText.length < 10) {
      return { language: 'en', confidence: 0.5 };
    }

    // franc returns ISO 639-3 code (e.g. 'deu', 'eng', 'und' for undetermined)
    const iso3 = franc(cleanText, { minLength: 10, only: Object.keys(FRANC_TO_ISO2) });

    if (iso3 === 'und') {
      // Undetermined — apply character-set heuristic as final fallback
      if (/[äöüßÄÖÜ]/.test(cleanText)) return { language: 'de', confidence: 0.75 };
      if (/[ñí¿¡]/.test(cleanText)) return { language: 'es', confidence: 0.75 };
      if (/[àâçèêëîïôùûüœæ]/.test(cleanText)) return { language: 'fr', confidence: 0.6 };
      if (/[àèéìòùáéíóú]/.test(cleanText)) return { language: 'it', confidence: 0.55 };
      return { language: 'en', confidence: 0.5 };
    }

    const iso2 = FRANC_TO_ISO2[iso3] || 'en';
    const language = SUPPORTED_LANGS.has(iso2) ? iso2 : 'en';

    // franc doesn't return a confidence score; we estimate based on text length
    // Longer texts = higher confidence in detection
    const confidence = cleanText.length >= 200 ? 0.95 : cleanText.length >= 50 ? 0.8 : 0.65;

    return { language, confidence };
  }
}

export const languageDetectionService = new LanguageDetectionService();
