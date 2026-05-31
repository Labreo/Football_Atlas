export interface ChunkRecord {
  chunk_id: string;
  document_id: string;
  content: string;
  section_title: string;
  page_number: number;
  word_count: number;
  concept_tags: string[]; // e.g. ["false_9", "midfield_overload"]
  language: string; // e.g. 'en', 'de', 'es'
  original_language: string;
}
