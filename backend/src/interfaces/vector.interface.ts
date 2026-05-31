import { ChunkRecord } from '../chunks/chunk.model';

/**
 * Interface for generating vector embeddings for text.
 */
export interface EmbeddingProvider {
  /**
   * Generates a single vector embedding for the input text.
   */
  generateEmbedding(text: string): Promise<number[]>;

  /**
   * Generates a batch of vector embeddings for the input texts.
   */
  generateEmbeddings(texts: string[]): Promise<number[][]>;
}

/**
 * Interface representing a vector store capable of saving and querying embeddings.
 */
export interface VectorStore {
  /**
   * Stores document chunks alongside their pre-calculated embeddings.
   */
  addVectors(vectors: number[][], chunks: ChunkRecord[]): Promise<void>;

  /**
   * Queries the vector store using cosine similarity or similar distance metrics.
   */
  similaritySearch(queryVector: number[], k: number): Promise<ChunkRecord[]>;

  /**
   * Queries the vector store with optional category filters.
   */
  similaritySearchWithFilter(
    queryVector: number[],
    k: number,
    filter: { conceptId?: string; documentId?: string }
  ): Promise<ChunkRecord[]>;
}

/**
 * Interface representing a query retrieval strategy (e.g. vector search, hybrid keyword-vector, etc.).
 */
export interface RetrievalStrategy {
  /**
   * Executes the retrieval strategy to return the top k relevant chunks.
   */
  retrieve(query: string, k: number): Promise<ChunkRecord[]>;
}
