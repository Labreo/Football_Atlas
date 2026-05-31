import { Logger } from './logger';

/**
 * Extracts and parses JSON from raw Granite text completions.
 * Handles markdown formatting wraps or loose conversation comments around the output.
 */
export function parseGraniteJson(rawText: string, traceId?: string): any {
  let cleaned = rawText.trim();
  
  // 1. Check for markdown JSON backtick blocks
  if (cleaned.includes('```')) {
    const matches = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (matches && matches[1]) {
      cleaned = matches[1].trim();
    }
  }

  // 2. Try straight parsing
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    // 3. Fallback: Find the bounds of the first outer JSON object
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1) {
      const candidate = cleaned.slice(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(candidate);
      } catch (innerErr) {
        Logger.error('Brace-bounded extraction failed to parse', innerErr, {
          raw_text: rawText,
          trace_id: traceId
        });
        throw new Error('Extractable text block contains syntax errors and cannot be parsed.');
      }
    }
    
    Logger.error('No JSON braces found in Granite text', null, {
      raw_text: rawText,
      trace_id: traceId
    });
    throw new Error('The generative response did not contain a valid JSON envelope.');
  }
}
