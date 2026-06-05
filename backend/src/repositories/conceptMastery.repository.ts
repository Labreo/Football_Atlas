import * as fs from 'fs';
import * as path from 'path';
import { ConceptMastery } from '@football-atlas/shared';
import { Logger } from '../utils/logger';

const DATA_DIR = path.resolve(__dirname, '../../data');
const MASTERY_FILE = path.join(DATA_DIR, 'concept_masteries.json');

export class ConceptMasteryRepository {
  private static instance: ConceptMasteryRepository;
  
  // userId -> conceptId -> ConceptMastery
  private masteries: Map<string, Map<string, ConceptMastery>> = new Map();

  private constructor() {
    this.loadFromDisk();
  }

  public static getInstance(): ConceptMasteryRepository {
    if (!ConceptMasteryRepository.instance) {
      ConceptMasteryRepository.instance = new ConceptMasteryRepository();
    }
    return ConceptMasteryRepository.instance;
  }

  private loadFromDisk(): void {
    try {
      if (!fs.existsSync(MASTERY_FILE)) {
        Logger.info('[ConceptMasteryRepository] No mastery database found. Starting clean.');
        return;
      }

      const raw = fs.readFileSync(MASTERY_FILE, 'utf-8');
      const data: Record<string, Record<string, ConceptMastery>> = JSON.parse(raw);

      for (const [userId, userMastery] of Object.entries(data)) {
        const innerMap = new Map<string, ConceptMastery>();
        for (const [conceptId, mastery] of Object.entries(userMastery)) {
          innerMap.set(conceptId, mastery);
        }
        this.masteries.set(userId, innerMap);
      }

      Logger.info(`[ConceptMasteryRepository] Loaded mastery records for ${this.masteries.size} users.`);
    } catch (err: any) {
      Logger.warn(`[ConceptMasteryRepository] Load failed: ${err.message}. Starting fresh.`);
    }
  }

  private saveToDisk(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      const data: Record<string, Record<string, ConceptMastery>> = {};
      for (const [userId, innerMap] of this.masteries.entries()) {
        data[userId] = Object.fromEntries(innerMap);
      }

      fs.writeFileSync(MASTERY_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err: any) {
      Logger.error(`[ConceptMasteryRepository] Save failed: ${err.message}`);
    }
  }

  public getOrCreateMastery(userId: string, conceptId: string): ConceptMastery {
    let userMap = this.masteries.get(userId);
    if (!userMap) {
      userMap = new Map();
      this.masteries.set(userId, userMap);
    }

    let mastery = userMap.get(conceptId);
    if (!mastery) {
      mastery = {
        concept_id: conceptId,
        completion_percentage: 0,
        confidence_score: 0,
        last_viewed: null,
        historical_examples_completed: [],
        breakdowns_completed: [],
        questions_asked: 0,
      };
      userMap.set(conceptId, mastery);
      this.saveToDisk();
    }

    return mastery;
  }

  public saveMastery(userId: string, mastery: ConceptMastery): void {
    let userMap = this.masteries.get(userId);
    if (!userMap) {
      userMap = new Map();
      this.masteries.set(userId, userMap);
    }
    userMap.set(mastery.concept_id, mastery);
    this.saveToDisk();
  }

  public getAllMasteryForUser(userId: string): ConceptMastery[] {
    const userMap = this.masteries.get(userId);
    if (!userMap) return [];
    return Array.from(userMap.values());
  }

  public clear(): void {
    this.masteries.clear();
    try {
      if (fs.existsSync(MASTERY_FILE)) {
        fs.unlinkSync(MASTERY_FILE);
      }
    } catch (_) {}
  }
}

export const conceptMasteryRepository = ConceptMasteryRepository.getInstance();
export default conceptMasteryRepository;
