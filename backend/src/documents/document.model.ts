export type DocumentType = 'pdf' | 'docx' | 'txt' | 'md';
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface DocumentMetadata {
  document_id: string;
  title: string;
  source: string;
  author: string;
  publication_year: number;
  document_type: DocumentType;
  upload_timestamp: string; // ISO 8601 DateTime string
  processing_status: ProcessingStatus;
  language: string; // e.g. 'en', 'de', 'es'
  original_language: string;
}

export interface DocumentRecord {
  document_id: string;
  metadata: DocumentMetadata;
  chunk_ids: string[];
  detected_concepts?: string[];
  processing_time_ms?: number;
  error_message?: string;
}
