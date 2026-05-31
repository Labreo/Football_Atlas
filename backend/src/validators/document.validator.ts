import { z } from 'zod';

export const UploadMetadataSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  source: z.string().min(1, 'Source description is required').max(200, 'Source too long'),
  author: z.string().min(1, 'Author name is required').max(100, 'Author too long'),
  publication_year: z.preprocess(
    (val) => parseInt(String(val), 10),
    z.number().int().min(1800, 'Invalid year').max(new Date().getFullYear() + 1, 'Future year not allowed')
  )
});

export const SearchQuerySchema = z.object({
  q: z.string().min(2, 'Query must be at least 2 characters long').max(100, 'Query too long')
});
