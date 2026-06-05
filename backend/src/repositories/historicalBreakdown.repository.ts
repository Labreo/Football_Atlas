import * as fs from 'fs';
import * as path from 'path';
import { HistoricalBreakdown, HistoricalBreakdownSchema } from '@football-atlas/shared';
import { Logger } from '../utils/logger';

const DATA_DIR = path.resolve(__dirname, '../../data');
const STORE_FILE = path.join(DATA_DIR, 'historical_breakdowns.json');

export class HistoricalBreakdownRepository {
  private static instance: HistoricalBreakdownRepository;
  private breakdowns: Map<string, HistoricalBreakdown> = new Map();

  private constructor() {
    this.loadFromDisk();
  }

  public static getInstance(): HistoricalBreakdownRepository {
    if (!HistoricalBreakdownRepository.instance) {
      HistoricalBreakdownRepository.instance = new HistoricalBreakdownRepository();
    }
    return HistoricalBreakdownRepository.instance;
  }

  private loadFromDisk(): void {
    try {
      if (!fs.existsSync(STORE_FILE)) {
        Logger.info('[HistoricalBreakdownRepository] No seed file found at data/historical_breakdowns.json.');
        return;
      }

      const raw = fs.readFileSync(STORE_FILE, 'utf-8');
      const data: HistoricalBreakdown[] = JSON.parse(raw);

      data.forEach(item => {
        // Validate each item at runtime with Zod
        const validation = HistoricalBreakdownSchema.safeParse(item);
        if (validation.success) {
          this.breakdowns.set(item.example_id, validation.data as HistoricalBreakdown);
        } else {
          Logger.warn(`[HistoricalBreakdownRepository] Validation failed for seeded item "${item.example_id}": ${validation.error.message}`);
        }
      });

      Logger.info(`[HistoricalBreakdownRepository] Loaded ${this.breakdowns.size} historical breakdowns from disk.`);
    } catch (err: any) {
      Logger.error('[HistoricalBreakdownRepository] Failed to load store file', err);
    }
  }

  public getByExampleId(exampleId: string): HistoricalBreakdown | undefined {
    return this.breakdowns.get(exampleId);
  }

  public getAll(): HistoricalBreakdown[] {
    return Array.from(this.breakdowns.values());
  }
}

export const historicalBreakdownRepository = HistoricalBreakdownRepository.getInstance();
