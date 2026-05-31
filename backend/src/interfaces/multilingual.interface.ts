import { ChunkRecord } from '../chunks/chunk.model';

/**
 * Interface representing a retriever capable of cross-lingual document mapping.
 */
export interface CrossLingualRetriever {
  /**
   * Retrieves chunks in their original languages that match the semantic intent of the query.
   */
  retrieveCrossLingual(query: string, targetLanguages: string[], k: number): Promise<ChunkRecord[]>;
}

/**
 * Interface representing a translation provider to translate chunks/queries on-demand.
 */
export interface TranslationProvider {
  /**
   * Translates text from source language to target language.
   */
  translate(text: string, sourceLang: string, targetLang: string): Promise<string>;

  /**
   * Translates a batch of text.
   */
  translateBatch(texts: string[], sourceLang: string, targetLang: string): Promise<string[]>;
}

/**
 * Interface representing a ranking strategy that weights chunks based on language matching/preferences.
 */
export interface LanguageAwareRanking {
  /**
   * Reranks retrieval hits based on user language preferences or match confidence scores.
   */
  rerank(chunks: ChunkRecord[], userLanguagePreference: string): Promise<ChunkRecord[]>;
}
