import { conceptVocabularyService } from './vocabulary.service';

export interface NormalizedQuery {
  originalQuery: string;
  detectedConceptId?: string;
  expansionTerms: string[];
}

export class QueryNormalizationService {
  /**
   * Normalizes and expands search inputs by identifying tactical concept mentions.
   */
  public normalizeQuery(query: string): NormalizedQuery {
    const cleanQuery = query.trim();
    const detectedConceptId = conceptVocabularyService.detectConceptFromQuery(cleanQuery);

    let expansionTerms: string[] = [];
    if (detectedConceptId) {
      expansionTerms = conceptVocabularyService.getAllKeywordsForConcept(detectedConceptId);
    }

    return {
      originalQuery: cleanQuery,
      detectedConceptId,
      expansionTerms
    };
  }
}

export const queryNormalizationService = new QueryNormalizationService();
