import * as fs from 'fs';
import * as path from 'path';
import { LearnerProfile } from '@football-atlas/shared';
import { Logger } from '../utils/logger';

const DATA_DIR = path.resolve(__dirname, '../../data');
const PROFILE_FILE = path.join(DATA_DIR, 'learner_profiles.json');

export class LearnerProfileRepository {
  private static instance: LearnerProfileRepository;
  private profiles: Map<string, LearnerProfile> = new Map();

  private constructor() {
    this.loadFromDisk();
  }

  public static getInstance(): LearnerProfileRepository {
    if (!LearnerProfileRepository.instance) {
      LearnerProfileRepository.instance = new LearnerProfileRepository();
    }
    return LearnerProfileRepository.instance;
  }

  private loadFromDisk(): void {
    try {
      if (!fs.existsSync(PROFILE_FILE)) {
        Logger.info('[LearnerProfileRepository] No profiles database found. Starting clean.');
        return;
      }

      const raw = fs.readFileSync(PROFILE_FILE, 'utf-8');
      const data: Record<string, LearnerProfile> = JSON.parse(raw);

      for (const [id, profile] of Object.entries(data)) {
        this.profiles.set(id, profile);
      }

      Logger.info(`[LearnerProfileRepository] Loaded ${this.profiles.size} profiles from disk.`);
    } catch (err: any) {
      Logger.warn(`[LearnerProfileRepository] Load failed: ${err.message}. Starting fresh.`);
    }
  }

  private saveToDisk(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      const data = Object.fromEntries(this.profiles);
      fs.writeFileSync(PROFILE_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err: any) {
      Logger.error(`[LearnerProfileRepository] Save failed: ${err.message}`);
    }
  }

  public getProfile(userId: string): LearnerProfile | undefined {
    return this.profiles.get(userId);
  }

  public getOrCreateProfile(userId: string): LearnerProfile {
    let profile = this.getProfile(userId);
    if (!profile) {
      profile = {
        userId,
        completed_concepts: [],
        completed_breakdowns: [],
        questions_asked: 0,
        learning_time: 0,
        favorite_topics: [],
        recommended_concepts: [],
        difficulty_level: 'beginner',
        active_path_id: null,
        started_paths: {},
        completed_paths: {},
      };
      this.saveProfile(profile);
    }
    return profile;
  }

  public saveProfile(profile: LearnerProfile): void {
    this.profiles.set(profile.userId, profile);
    this.saveToDisk();
  }

  public clear(): void {
    this.profiles.clear();
    try {
      if (fs.existsSync(PROFILE_FILE)) {
        fs.unlinkSync(PROFILE_FILE);
      }
    } catch (_) {}
  }
}

export const learnerProfileRepository = LearnerProfileRepository.getInstance();
export default learnerProfileRepository;
