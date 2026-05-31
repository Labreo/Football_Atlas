import { ChunkRecord } from '../chunks/chunk.model';
import { knowledgeStore } from './store.service';
import { queryNormalizationService } from './query-normalization.service';

export class KnowledgeRetrievalService {
  /**
   * Retrieves a single chunk record by its unique ID.
   */
  public getChunkById(chunkId: string): ChunkRecord | undefined {
    return knowledgeStore.getChunk(chunkId);
  }

  /**
   * Retrieves all chunks linked to a tactical concept ID.
   */
  public getChunksForConcept(conceptId: string): ChunkRecord[] {
    return knowledgeStore.getChunksForConcept(conceptId);
  }

  /**
   * Upgraded search by keyword: normalizes search terms and performs
   * cross-lingual concept matches using query expansion.
   */
  public searchByKeyword(query: string): ChunkRecord[] {
    const term = query.trim();
    if (!term) return [];

    // 1. Normalize query and check for concept match
    const normalized = queryNormalizationService.normalizeQuery(term);
    const results: ChunkRecord[] = [];
    const seenChunkIds = new Set<string>();

    // 2. If a concept was matched, fetch all chunks tagged with this concept
    if (normalized.detectedConceptId) {
      const conceptChunks = this.getChunksForConcept(normalized.detectedConceptId);
      for (const chunk of conceptChunks) {
        if (!seenChunkIds.has(chunk.chunk_id)) {
          results.push(chunk);
          seenChunkIds.add(chunk.chunk_id);
        }
      }
    }

    // 3. Match terms case-insensitively. If we expanded concepts, match any translated keyword.
    // Otherwise, match the user's original query term.
    const searchTerms = normalized.expansionTerms.length > 0 
      ? normalized.expansionTerms.map(t => t.toLowerCase())
      : [term.toLowerCase()];

    const allChunks = knowledgeStore.getAllChunks();
    for (const chunk of allChunks) {
      if (seenChunkIds.has(chunk.chunk_id)) continue;

      const contentLower = chunk.content.toLowerCase();
      const sectionLower = chunk.section_title.toLowerCase();

      // Check if chunk matches any of the terms
      const isMatch = searchTerms.some((word) => {
        return contentLower.includes(word) || sectionLower.includes(word);
      });

      if (isMatch) {
        results.push(chunk);
        seenChunkIds.add(chunk.chunk_id);
      }
    }

    return results;
  }

  /**
   * Retrieves related chunks that share one or more tactical concept tags.
   * Sorted by the count of shared tags.
   */
  public getRelatedKnowledge(chunkId: string): ChunkRecord[] {
    const sourceChunk = this.getChunkById(chunkId);
    if (!sourceChunk || sourceChunk.concept_tags.length === 0) return [];

    const sourceTags = new Set(sourceChunk.concept_tags);
    const relatedChunksWithScores: { chunk: ChunkRecord; score: number }[] = [];

    const allChunks = knowledgeStore.getAllChunks();
    for (const chunk of allChunks) {
      if (chunk.chunk_id === chunkId) continue;

      let score = 0;
      for (const tag of chunk.concept_tags) {
        if (sourceTags.has(tag)) {
          score++;
        }
      }

      if (score > 0) {
        relatedChunksWithScores.push({ chunk, score });
      }
    }

    relatedChunksWithScores.sort((a, b) => b.score - a.score);

    return relatedChunksWithScores.map((item) => item.chunk);
  }

  /**
   * Retrieves all chunks extracted from a specific document.
   */
  public getDocumentChunks(documentId: string): ChunkRecord[] {
    return knowledgeStore
      .getAllChunks()
      .filter((chunk) => chunk.document_id === documentId);
  }
}

export const knowledgeRetrievalService = new KnowledgeRetrievalService();
