import * as crypto from 'crypto';
import { DocumentRecord, DocumentMetadata, DocumentType } from '../documents/document.model';
import { ChunkRecord } from '../chunks/chunk.model';
import { doclingParserService } from './docling.service';
import { enrichmentService } from '../enrichment/enrichment.service';
import { knowledgeStore } from './store.service';
import { UploadMetadataSchema } from '../validators/document.validator';
import { Logger } from '../utils/logger';
import { languageDetectionService } from './language-detection.service';

export class DocumentIngestionService {
  private allowedExtensions: Set<string> = new Set(['pdf', 'docx', 'txt', 'md']);

  /**
   * Ingests, parses, and indexes a football tactical document.
   */
  public async ingestDocument(
    file: { buffer: Buffer; originalname: string; mimetype: string },
    rawMetadata: any
  ): Promise<DocumentRecord> {
    const startTime = Date.now();
    const documentId = `doc_${crypto.randomBytes(8).toString('hex')}`;

    // 1. Validate Metadata using Zod
    const validatedMetadata = UploadMetadataSchema.parse(rawMetadata);

    // 2. Validate File Extension
    const extension = file.originalname.split('.').pop()?.toLowerCase();
    if (!extension || !this.allowedExtensions.has(extension)) {
      throw new Error(`[Ingestion Error] Unsupported file type: .${extension || 'unknown'}`);
    }

    // 3. Initialize Document Metadata with defaults
    const docMetadata: DocumentMetadata = {
      document_id: documentId,
      title: validatedMetadata.title,
      source: validatedMetadata.source,
      author: validatedMetadata.author,
      publication_year: validatedMetadata.publication_year,
      document_type: extension as DocumentType,
      upload_timestamp: new Date().toISOString(),
      processing_status: 'processing',
      language: 'en', // Will be detected during processing
      original_language: 'en'
    };

    const docRecord: DocumentRecord = {
      document_id: documentId,
      metadata: docMetadata,
      chunk_ids: [],
      detected_concepts: []
    };

    // Save initial record to represent parsing start
    knowledgeStore.addDocument(docRecord);

    try {
      // 4. Parse document buffer into structural chunks using Docling Parser Service
      const parsedChunks = doclingParserService.parseDocument(file.buffer, file.originalname, extension);

      if (parsedChunks.length === 0) {
        throw new Error('[Ingestion Error] Ingested document yielded no text contents or chunks.');
      }

      // Detect document-wide language from combined sample text
      const sampleText = parsedChunks.slice(0, 3).map((c) => c.content).join(' ');
      const detectedDocLang = languageDetectionService.detectLanguage(sampleText);
      docMetadata.language = detectedDocLang.language;
      docMetadata.original_language = detectedDocLang.language;

      const chunkIds: string[] = [];
      const uniqueDetectedConcepts = new Set<string>();

      // Track duplicate chunk content
      const existingChunks = knowledgeStore.getAllChunks();

      for (const [index, parsed] of parsedChunks.entries()) {
        const contentTrimmed = parsed.content.trim();

        // QC Rule: Reject empty chunks
        if (!contentTrimmed) {
          Logger.warn(`[Ingestion QC] Skipped empty chunk index ${index} in document ${documentId}`);
          continue;
        }

        // QC Rule: Reject duplicate chunks
        const isDuplicate = existingChunks.some((c) => c.content === contentTrimmed);
        if (isDuplicate) {
          Logger.warn(`[Ingestion QC] Skipped duplicate chunk content in document ${documentId}`);
          continue;
        }

        // 5. Language detection at Chunk level
        const detectedChunkLang = languageDetectionService.detectLanguage(contentTrimmed).language;

        // 6. Automatic Concept Detection
        const tags = enrichmentService.detectConcepts(contentTrimmed, detectedChunkLang);
        tags.forEach((t) => uniqueDetectedConcepts.add(t));

        // 7. Save Chunk Record
        const chunkId = `chk_${crypto.randomBytes(8).toString('hex')}`;
        const chunkRecord: ChunkRecord = {
          chunk_id: chunkId,
          document_id: documentId,
          content: contentTrimmed,
          section_title: parsed.section_title,
          page_number: parsed.page_number,
          word_count: parsed.word_count,
          concept_tags: tags,
          language: detectedChunkLang,
          original_language: detectedChunkLang
        };

        knowledgeStore.addChunk(chunkRecord, docMetadata.title);
        chunkIds.push(chunkId);
      }

      // Update document record status
      const processingTime = Date.now() - startTime;
      docRecord.chunk_ids = chunkIds;
      docRecord.processing_time_ms = processingTime;
      docRecord.metadata.processing_status = 'completed';
      docRecord.detected_concepts = Array.from(uniqueDetectedConcepts);

      knowledgeStore.addDocument(docRecord);

      // Log structured metrics
      Logger.info('⚽ Document ingestion completed successfully.', {
        document_id: documentId,
        processing_time_ms: processingTime,
        chunk_count: chunkIds.length,
        detected_concepts: Array.from(uniqueDetectedConcepts),
        detected_language: docMetadata.language
      });

      return docRecord;
    } catch (error: any) {
      docRecord.metadata.processing_status = 'failed';
      docRecord.error_message = error.message;
      knowledgeStore.addDocument(docRecord);

      Logger.error('❌ Document ingestion failed.', {
        document_id: documentId,
        error: error.message
      });

      throw error;
    }
  }
}

export const documentIngestionService = new DocumentIngestionService();
