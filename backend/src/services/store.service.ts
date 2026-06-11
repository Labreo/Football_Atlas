import * as fs from 'fs';
import * as path from 'path';
import { DocumentRecord } from '../documents/document.model';
import { ChunkRecord } from '../chunks/chunk.model';
import { tacticalRegistry } from '@football-atlas/shared';
import { Logger } from '../utils/logger';

// ─────────────────────────────────────────────
// Persistence: JSON file store
// ─────────────────────────────────────────────
const DATA_DIR = path.resolve(__dirname, '../../data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');

interface PersistedStore {
  documents: Record<string, DocumentRecord>;
  chunks: Record<string, ChunkRecord>;
  conceptToChunks: Record<string, string[]>;
}

// ─────────────────────────────────────────────
// Real relevance scoring: word-overlap ratio
// ─────────────────────────────────────────────
/**
 * Computes a relevance score [0–100] for a chunk against a set of concept keywords.
 * Score = (number of unique keyword hits in chunk content) / (total keywords) × 100
 */
function computeRelevanceScore(chunkContent: string, conceptKeywords: string[]): number {
  if (conceptKeywords.length === 0) return 0;
  const lowerContent = chunkContent.toLowerCase();
  const hits = conceptKeywords.filter((kw) => lowerContent.includes(kw.toLowerCase())).length;
  return Math.round((hits / conceptKeywords.length) * 100);
}

export class KnowledgeStore {
  private static instance: KnowledgeStore;

  private documents: Map<string, DocumentRecord> = new Map();
  private chunks: Map<string, ChunkRecord> = new Map();
  private conceptToChunks: Map<string, Set<string>> = new Map();

  // Debounce timer for disk writes
  private saveTimer: ReturnType<typeof setTimeout> | null = null;

  private constructor() {
    this.loadFromDisk();
  }

  public static getInstance(): KnowledgeStore {
    if (!KnowledgeStore.instance) {
      KnowledgeStore.instance = new KnowledgeStore();
    }
    return KnowledgeStore.instance;
  }

  // ─────────────────────────────────────────────
  // Persistence — Load
  // ─────────────────────────────────────────────
  private loadFromDisk(): void {
    try {
      if (!fs.existsSync(STORE_FILE)) {
        Logger.info('[KnowledgeStore] No persisted store found. Starting fresh.');
        return;
      }

      const raw = fs.readFileSync(STORE_FILE, 'utf-8');
      const data: PersistedStore = JSON.parse(raw);

      // Restore documents
      for (const [id, doc] of Object.entries(data.documents || {})) {
        this.documents.set(id, doc);
      }

      // Restore chunks and link them back to the registry
      for (const [id, chunk] of Object.entries(data.chunks || {})) {
        this.chunks.set(id, chunk);
        const doc = this.documents.get(chunk.document_id);
        const docTitle = doc ? doc.metadata.title : 'Unknown Source';
        this.linkChunkToRegistry(chunk, docTitle);
      }

      // Restore concept → chunk index
      for (const [conceptId, chunkIds] of Object.entries(data.conceptToChunks || {})) {
        this.conceptToChunks.set(conceptId, new Set(chunkIds));
      }

      Logger.info(`[KnowledgeStore] Loaded from disk: ${this.documents.size} documents, ${this.chunks.size} chunks.`);
    } catch (err: any) {
      Logger.warn(`[KnowledgeStore] Failed to load persisted store: ${err.message}. Starting fresh.`);
    }
  }

  // ─────────────────────────────────────────────
  // Persistence — Save (debounced 500ms)
  // ─────────────────────────────────────────────
  private scheduleSave(): void {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.flushToDisk(), 500);
  }

  private flushToDisk(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      const data: PersistedStore = {
        documents: Object.fromEntries(this.documents),
        chunks: Object.fromEntries(this.chunks),
        conceptToChunks: Object.fromEntries(
          Array.from(this.conceptToChunks.entries()).map(([k, v]) => [k, Array.from(v)])
        ),
      };

      fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err: any) {
      Logger.warn(`[KnowledgeStore] Failed to persist store to disk: ${err.message}`);
    }
  }

  // ─────────────────────────────────────────────
  // Document operations
  // ─────────────────────────────────────────────

  public addDocument(doc: DocumentRecord): void {
    this.documents.set(doc.document_id, doc);
    this.scheduleSave();
  }

  public getDocument(docId: string): DocumentRecord | undefined {
    return this.documents.get(docId);
  }

  public getAllDocuments(): DocumentRecord[] {
    return Array.from(this.documents.values());
  }

  // ─────────────────────────────────────────────
  // Chunk operations
  // ─────────────────────────────────────────────

  public addChunk(chunk: ChunkRecord, documentTitle: string): void {
    this.chunks.set(chunk.chunk_id, chunk);
    this.linkChunkToRegistry(chunk, documentTitle);
    this.scheduleSave();
  }

  /**
   * Helper to index a chunk in-memory and register it to the shared tactical registry.
   */
  private linkChunkToRegistry(chunk: ChunkRecord, documentTitle: string): void {
    chunk.concept_tags.forEach((tag) => {
      // 1. In-memory concept → chunk index
      if (!this.conceptToChunks.has(tag)) {
        this.conceptToChunks.set(tag, new Set());
      }
      this.conceptToChunks.get(tag)!.add(chunk.chunk_id);

      // 2. Link to Tactical Concept Registry with real relevance score
      const concept = tacticalRegistry.getConcept(tag);
      if (concept) {
        if (!concept.docling_chunks) {
          concept.docling_chunks = [];
        }

        const exists = concept.docling_chunks.some((ref) => ref.chunk_id === chunk.chunk_id);
        if (!exists) {
          // Gather all keywords for this concept across all languages
          const allKeywords: string[] = [];
          try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const { conceptVocabularyService } = require('./vocabulary.service');
            const allLangs = ['en', 'de', 'es', 'fr', 'it'];
            for (const lang of allLangs) {
              allKeywords.push(...conceptVocabularyService.getKeywordsForConcept(tag, lang));
            }
          } catch (_) {}

          const relevanceScore = allKeywords.length > 0
            ? computeRelevanceScore(chunk.content, allKeywords)
            : 50; // neutral default if vocab lookup fails

          concept.docling_chunks.push({
            chunk_id: chunk.chunk_id,
            source_document: documentTitle,
            relevance_score: relevanceScore,
          });
        }
      }
    });
  }

  public getChunk(chunkId: string): ChunkRecord | undefined {
    return this.chunks.get(chunkId);
  }

  public getAllChunks(): ChunkRecord[] {
    return Array.from(this.chunks.values());
  }

  public getChunksForConcept(conceptId: string): ChunkRecord[] {
    const chunkIds = this.conceptToChunks.get(conceptId);
    if (!chunkIds) return [];

    return Array.from(chunkIds)
      .map((id) => this.getChunk(id))
      .filter((chunk): chunk is ChunkRecord => chunk !== undefined);
  }

  /**
   * Clears all in-memory state and removes the persisted store file.
   */
  public clear(): void {
    this.documents.clear();
    this.chunks.clear();
    this.conceptToChunks.clear();

    for (const concept of tacticalRegistry.getAllConcepts()) {
      concept.docling_chunks = [];
    }

    try {
      if (fs.existsSync(STORE_FILE)) fs.unlinkSync(STORE_FILE);
    } catch (_) {}
  }
}

export const knowledgeStore = KnowledgeStore.getInstance();
