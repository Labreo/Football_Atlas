import * as fs from 'fs';
import * as path from 'path';
import { HistoricalExample, HistoricalExampleSchema } from '@football-atlas/shared';
import { Logger } from '../utils/logger';

const DATA_DIR = path.resolve(__dirname, '../../data');
const STORE_FILE = path.join(DATA_DIR, 'historical_examples.json');

export class HistoricalExampleRepository {
  private static instance: HistoricalExampleRepository;
  private examples: Map<string, HistoricalExample> = new Map();

  private constructor() {
    this.loadFromDisk();
  }

  public static getInstance(): HistoricalExampleRepository {
    if (!HistoricalExampleRepository.instance) {
      HistoricalExampleRepository.instance = new HistoricalExampleRepository();
    }
    return HistoricalExampleRepository.instance;
  }

  private loadFromDisk(): void {
    try {
      if (!fs.existsSync(STORE_FILE)) {
        Logger.info('[HistoricalExampleRepository] No seed file found at data/historical_examples.json.');
        return;
      }

      const raw = fs.readFileSync(STORE_FILE, 'utf-8');
      const data: HistoricalExample[] = JSON.parse(raw);

      data.forEach(item => {
        // Validate each item at runtime
        const validation = HistoricalExampleSchema.safeParse(item);
        if (validation.success) {
          this.examples.set(item.example_id, validation.data as HistoricalExample);
        } else {
          Logger.warn(`[HistoricalExampleRepository] Validation failed for seeded item "${item.example_id}": ${validation.error.message}`);
        }
      });

      Logger.info(`[HistoricalExampleRepository] Loaded ${this.examples.size} historical examples from disk.`);
    } catch (err: any) {
      Logger.error('[HistoricalExampleRepository] Failed to load store file', err);
    }
  }

  private flushToDisk(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      const list = Array.from(this.examples.values());
      fs.writeFileSync(STORE_FILE, JSON.stringify(list, null, 2), 'utf-8');
    } catch (err: any) {
      Logger.error('[HistoricalExampleRepository] Failed to write store file', err);
    }
  }

  public getById(id: string): HistoricalExample | undefined {
    return this.examples.get(id);
  }

  public getAll(): HistoricalExample[] {
    return Array.from(this.examples.values());
  }

  public getByConcept(conceptId: string): HistoricalExample[] {
    return this.getAll().filter(item => item.concept_id === conceptId);
  }

  public add(example: HistoricalExample): void {
    const validation = HistoricalExampleSchema.safeParse(example);
    if (!validation.success) {
      throw new Error(`[Repository Error] Schema validation failed: ${validation.error.message}`);
    }
    this.examples.set(example.example_id, validation.data as HistoricalExample);
    this.flushToDisk();
  }

  public delete(id: string): boolean {
    const deleted = this.examples.delete(id);
    if (deleted) {
      this.flushToDisk();
    }
    return deleted;
  }
}

export const historicalExampleRepository = HistoricalExampleRepository.getInstance();
