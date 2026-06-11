import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { documentIngestionService } from '../services/ingestion.service';
import { knowledgeRetrievalService } from '../services/retrieval.service';
import { knowledgeStore } from '../services/store.service';
import { SearchQuerySchema } from '../validators/document.validator';
import { z } from 'zod';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024 // Limit file size to 100MB
  }
});

/**
 * POST /documents/upload
 * Accepts file upload and text metadata form fields.
 */
router.post(
  '/documents/upload',
  upload.single('file'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'No file was uploaded. Please attach a file using form-data field "file".'
        });
      }

      // Convert body fields to numbers where appropriate for validation
      const rawMetadata = {
        title: req.body.title,
        source: req.body.source,
        author: req.body.author,
        publication_year: req.body.publication_year
      };

      const docRecord = await documentIngestionService.ingestDocument(
        {
          buffer: req.file.buffer,
          originalname: req.file.originalname,
          mimetype: req.file.mimetype
        },
        rawMetadata
      );

      return res.status(201).json(docRecord);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Validation failed',
          details: error.format()
        });
      }
      return next(error);
    }
  }
);

/**
 * GET /documents
 * Returns list of all uploaded document metadata.
 */
router.get('/documents', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const docs = knowledgeStore.getAllDocuments();
    const metadataList = docs.map((doc) => doc.metadata);
    return res.status(200).json(metadataList);
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /documents/:id
 * Returns document record details.
 */
router.get('/documents/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doc = knowledgeStore.getDocument(req.params.id);
    if (!doc) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Document with ID ${req.params.id} does not exist.`
      });
    }
    return res.status(200).json(doc);
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /documents/:id/chunks
 * Returns all parsed chunks for a document.
 */
router.get('/documents/:id/chunks', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doc = knowledgeStore.getDocument(req.params.id);
    if (!doc) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Document with ID ${req.params.id} does not exist.`
      });
    }

    const chunks = knowledgeRetrievalService.getDocumentChunks(req.params.id);
    return res.status(200).json(chunks);
  } catch (error) {
    return next(error);
  }
});

/**
 * DELETE /documents
 * Clears all persisted knowledge store state and resets document-chunk indexes.
 */
router.delete('/documents', async (req: Request, res: Response, next: NextFunction) => {
  try {
    knowledgeStore.clear();
    return res.status(200).json({ success: true, message: 'Knowledge store reset successfully.' });
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /concepts/:id/chunks
 * Returns all chunks linked to a concept.
 */
router.get('/concepts/:id/chunks', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const chunks = knowledgeRetrievalService.getChunksForConcept(req.params.id);
    return res.status(200).json(chunks);
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /search
 * Searches all chunks by keyword query string.
 */
router.get('/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsedQuery = SearchQuerySchema.parse({
      q: req.query.q
    });

    const hits = knowledgeRetrievalService.searchByKeyword(parsedQuery.q);
    return res.status(200).json(hits);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid search query parameters',
        details: error.format()
      });
    }
    return next(error);
  }
});

export default router;
