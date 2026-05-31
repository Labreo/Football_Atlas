import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as crypto from 'crypto';
import { execSync } from 'child_process';
import { Logger } from '../utils/logger';

export interface ParsedChunk {
  content: string;
  section_title: string;
  /**
   * Estimated page number based on word count (~250 words per page).
   * NOTE: This is an approximation, not extracted from actual PDF page metadata.
   */
  page_number: number;
  word_count: number;
}

// Path to the Docling CLI binary (configured via environment or detected from common locations)
const DOCLING_BINARY =
  process.env.DOCLING_PATH ||
  [
    '/Users/sanjaywaradkar/miniforge3/bin/docling',
    '/opt/homebrew/bin/docling',
    '/usr/local/bin/docling',
  ].find((p) => fs.existsSync(p)) ||
  'docling'; // fallback to PATH

export class DoclingParserService {
  /**
   * Parses a document file buffer and returns structural chunks.
   *
   * - For .md / .txt: directly sanitizes and chunks the text.
   * - For .pdf / .docx: runs the Docling CLI to convert to Markdown first,
   *   then chunks the result. Throws an error if Docling is unavailable.
   */
  public parseDocument(
    buffer: Buffer,
    filename: string,
    fileExtension: string
  ): ParsedChunk[] {
    let rawText = '';

    if (fileExtension === 'txt' || fileExtension === 'md') {
      rawText = buffer.toString('utf-8');
      rawText = this.sanitizeMarkdown(rawText);
    } else if (fileExtension === 'pdf' || fileExtension === 'docx') {
      rawText = this.convertWithDocling(buffer, filename, fileExtension);
    } else {
      throw new Error(
        `[DoclingParser] Unsupported file type: .${fileExtension}. Supported: pdf, docx, md, txt.`
      );
    }

    return this.chunkText(rawText);
  }

  /**
   * Converts a binary PDF/DOCX file using the Docling CLI.
   * Saves buffer to a temp file, runs Docling, reads resulting Markdown.
   * Throws a descriptive error if Docling is not installed.
   */
  private convertWithDocling(buffer: Buffer, filename: string, ext: string): string {
    const tmpId = crypto.randomBytes(6).toString('hex');
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), `football-atlas-${tmpId}-`));
    const tmpInput = path.join(tmpDir, filename);
    const tmpOutput = path.join(tmpDir, 'output');

    try {
      // 1. Write uploaded file to temp location
      fs.writeFileSync(tmpInput, buffer);
      fs.mkdirSync(tmpOutput, { recursive: true });

      // 2. Verify Docling binary exists
      if (!fs.existsSync(DOCLING_BINARY) && DOCLING_BINARY !== 'docling') {
        throw new Error(
          `[DoclingParser] Docling CLI not found at "${DOCLING_BINARY}". ` +
          `Install it with: pip install docling. Or set the DOCLING_PATH environment variable.`
        );
      }

      Logger.info(`[DoclingParser] Converting "${filename}" via Docling CLI...`);

      // 3. Run Docling CLI (--no-ocr --no-tables for speed; adjust as needed)
      execSync(
        `"${DOCLING_BINARY}" --no-ocr --to md --output "${tmpOutput}" "${tmpInput}"`,
        { stdio: ['ignore', 'pipe', 'pipe'], timeout: 5 * 60 * 1000 } // 5 min timeout
      );

      // 4. Find the resulting .md file
      const baseName = path.basename(filename, path.extname(filename));
      const mdPath = path.join(tmpOutput, `${baseName}.md`);

      if (!fs.existsSync(mdPath)) {
        // Docling sometimes uses a sanitized filename — find any .md
        const mdFiles = fs.readdirSync(tmpOutput).filter((f) => f.endsWith('.md'));
        if (mdFiles.length === 0) {
          throw new Error(
            `[DoclingParser] Docling produced no Markdown output for "${filename}". ` +
            `The file may be corrupted, password-protected, or image-only.`
          );
        }
        const actualMd = path.join(tmpOutput, mdFiles[0]);
        const md = fs.readFileSync(actualMd, 'utf-8');
        Logger.info(`[DoclingParser] Conversion complete. Markdown length: ${md.length} chars.`);
        return this.sanitizeMarkdown(md);
      }

      const md = fs.readFileSync(mdPath, 'utf-8');
      Logger.info(`[DoclingParser] Conversion complete. Markdown length: ${md.length} chars.`);
      return this.sanitizeMarkdown(md);
    } finally {
      // 5. Always clean up temp files
      try {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      } catch (_) {}
    }
  }

  /**
   * Sanitizes Markdown text by removing embedded base64 image data and noise.
   */
  private sanitizeMarkdown(text: string): string {
    // Remove Markdown image tags with base64 data URIs
    text = text.replace(/!\[.*?\]\(data:[^)]+\)/g, '');
    // Remove HTML img tags with data URIs
    text = text.replace(/<img[^>]+src=["']data:[^"']+["'][^>]*\/?>/gi, '');
    // Collapse excessive blank lines
    text = text.replace(/\n{3,}/g, '\n\n');
    return text;
  }

  /**
   * Splits text into semantic structural chunks, respecting Markdown section headers.
   * Page numbers are estimated (~250 words per page) — not extracted from PDF metadata.
   */
  private chunkText(text: string): ParsedChunk[] {
    const lines = text.split(/\r?\n/);
    const chunks: ParsedChunk[] = [];

    let currentSection = 'Introduction';
    let currentParagraphs: string[] = [];
    let currentWordCount = 0;
    let currentPage = 1;
    let pageWordAccumulator = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Detect section headers (Markdown # or ALL-CAPS short lines)
      if (
        trimmed.startsWith('#') ||
        (trimmed.length < 60 && trimmed === trimmed.toUpperCase() && !trimmed.endsWith('.'))
      ) {
        if (currentParagraphs.length > 0) {
          chunks.push({
            content: currentParagraphs.join('\n\n'),
            section_title: currentSection,
            page_number: currentPage,
            word_count: currentWordCount,
          });
          currentParagraphs = [];
          currentWordCount = 0;
        }
        currentSection = trimmed.replace(/^#+\s*/, '');
        continue;
      }

      currentParagraphs.push(trimmed);
      const wordsInLine = trimmed.split(/\s+/).filter((w) => w.length > 0).length;
      currentWordCount += wordsInLine;
      pageWordAccumulator += wordsInLine;

      // Estimated page increment every ~250 words
      if (pageWordAccumulator >= 250) {
        currentPage++;
        pageWordAccumulator = 0;
      }

      // Yield chunk at ~150-word threshold
      if (currentWordCount >= 150) {
        chunks.push({
          content: currentParagraphs.join('\n\n'),
          section_title: currentSection,
          page_number: currentPage,
          word_count: currentWordCount,
        });
        currentParagraphs = [];
        currentWordCount = 0;
      }
    }

    // Flush remaining content
    if (currentParagraphs.length > 0) {
      chunks.push({
        content: currentParagraphs.join('\n\n'),
        section_title: currentSection,
        page_number: currentPage,
        word_count: currentWordCount,
      });
    }

    return chunks;
  }
}

export const doclingParserService = new DoclingParserService();
