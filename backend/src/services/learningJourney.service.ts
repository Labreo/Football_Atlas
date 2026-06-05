import * as fs from 'fs';
import * as path from 'path';
import {
  LearnerProfile,
  ConceptMastery,
  ActivityLog,
  tacticalRegistry,
} from '@football-atlas/shared';
import { learnerProfileRepository } from '../repositories/learnerProfile.repository';
import { conceptMasteryRepository } from '../repositories/conceptMastery.repository';
import { learningRecommendationService } from './learningRecommendation.service';
import { Logger } from '../utils/logger';

const DATA_DIR = path.resolve(__dirname, '../../data');
const ACTIVITIES_FILE = path.join(DATA_DIR, 'activity_logs.json');

export class LearningJourneyService {
  private static instance: LearningJourneyService;
  
  // userId -> ActivityLog[]
  private activityLogs: Map<string, ActivityLog[]> = new Map();

  private constructor() {
    this.loadActivities();
  }

  public static getInstance(): LearningJourneyService {
    if (!LearningJourneyService.instance) {
      LearningJourneyService.instance = new LearningJourneyService();
    }
    return LearningJourneyService.instance;
  }

  private loadActivities(): void {
    try {
      if (!fs.existsSync(ACTIVITIES_FILE)) {
        return;
      }
      const raw = fs.readFileSync(ACTIVITIES_FILE, 'utf-8');
      const data: Record<string, ActivityLog[]> = JSON.parse(raw);
      for (const [userId, logs] of Object.entries(data)) {
        this.activityLogs.set(userId, logs);
      }
    } catch (err: any) {
      Logger.error(`[LearningJourneyService] Failed to load activity logs: ${err.message}`);
    }
  }

  private saveActivities(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const data = Object.fromEntries(this.activityLogs);
      fs.writeFileSync(ACTIVITIES_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err: any) {
      Logger.error(`[LearningJourneyService] Failed to save activity logs: ${err.message}`);
    }
  }

  public getOrCreateProfile(userId: string): LearnerProfile {
    const profile = learnerProfileRepository.getOrCreateProfile(userId);
    this.updateRecommendations(profile);
    return profile;
  }

  public saveProfile(profile: LearnerProfile): void {
    learnerProfileRepository.saveProfile(profile);
  }

  public getMasteries(userId: string): ConceptMastery[] {
    // Make sure we have mastery profiles initialized for all 10 concepts
    const concepts = tacticalRegistry.getAllConcepts();
    const list: ConceptMastery[] = [];
    for (const c of concepts) {
      list.push(conceptMasteryRepository.getOrCreateMastery(userId, c.concept_id));
    }
    return list;
  }

  public getActivities(userId: string): ActivityLog[] {
    return this.activityLogs.get(userId) || [];
  }

  public logActivity(
    userId: string,
    type: ActivityLog['activity_type'],
    details: { conceptId?: string; exampleId?: string; pathId?: string; metadata?: Record<string, any> }
  ): void {
    const logs = this.activityLogs.get(userId) || [];
    const newLog: ActivityLog = {
      id: Math.random().toString(36).substring(2, 9),
      userId,
      activity_type: type,
      concept_id: details.conceptId,
      example_id: details.exampleId,
      path_id: details.pathId,
      timestamp: new Date().toISOString(),
      metadata: details.metadata,
    };
    
    // Unshift to keep newest at the top
    logs.unshift(newLog);
    
    // Limit to last 50 activities
    if (logs.length > 50) {
      logs.pop();
    }
    
    this.activityLogs.set(userId, logs);
    this.saveActivities();
  }

  /**
   * Updates recommendation cache on the user's profile
   */
  private updateRecommendations(profile: LearnerProfile): void {
    const masteries = this.getMasteries(profile.userId);
    const recs = learningRecommendationService.generateRecommendations(profile, masteries);
    const recommendedList: string[] = [];
    if (recs.next_concept_id) {
      recommendedList.push(recs.next_concept_id);
    }
    recommendedList.push(...recs.related_concept_ids);
    profile.recommended_concepts = Array.from(new Set(recommendedList)).slice(0, 4);
    learnerProfileRepository.saveProfile(profile);
  }

  /**
   * Sets active learning path
   */
  public startPath(userId: string, pathId: string): LearnerProfile {
    const profile = this.getOrCreateProfile(userId);
    profile.active_path_id = pathId;
    
    if (!profile.started_paths[pathId]) {
      profile.started_paths[pathId] = new Date().toISOString();
      this.logActivity(userId, 'path_started', { pathId });
    }
    
    this.updateRecommendations(profile);
    return profile;
  }

  /**
   * Tracks concept view (adds progress and sets last viewed)
   */
  public trackConceptView(userId: string, conceptId: string): void {
    const profile = this.getOrCreateProfile(userId);
    const mastery = conceptMasteryRepository.getOrCreateMastery(userId, conceptId);
    
    mastery.last_viewed = new Date().toISOString();
    if (mastery.completion_percentage < 10) {
      mastery.completion_percentage = 10; // set basic progress
    }
    
    conceptMasteryRepository.saveMastery(userId, mastery);
    this.logActivity(userId, 'concept_viewed', { conceptId });
    this.updateRecommendations(profile);
  }

  /**
   * Completes a playbook lesson
   */
  public completeConcept(userId: string, conceptId: string): LearnerProfile {
    const profile = this.getOrCreateProfile(userId);
    const mastery = conceptMasteryRepository.getOrCreateMastery(userId, conceptId);
    
    mastery.completion_percentage = 100;
    conceptMasteryRepository.saveMastery(userId, mastery);

    if (!profile.completed_concepts.includes(conceptId)) {
      profile.completed_concepts.push(conceptId);
      this.logActivity(userId, 'concept_completed', { conceptId });
      
      // Check active learning path completion
      if (profile.active_path_id) {
        const pathObj = learningRecommendationService.getPathById(profile.active_path_id);
        if (pathObj) {
          const completedAll = pathObj.ordered_concepts.every((cid) =>
            profile.completed_concepts.includes(cid)
          );
          if (completedAll && !profile.completed_paths[profile.active_path_id]) {
            profile.completed_paths[profile.active_path_id] = new Date().toISOString();
            this.logActivity(userId, 'path_completed', { pathId: profile.active_path_id });
          }
        }
      }
    }

    this.recalculateConfidence(userId, conceptId);
    this.updateRecommendations(profile);
    return profile;
  }

  /**
   * Completes a breakdown sequence
   */
  public completeBreakdown(userId: string, conceptId: string, exampleId: string): LearnerProfile {
    const profile = this.getOrCreateProfile(userId);
    
    if (!profile.completed_breakdowns.includes(exampleId)) {
      profile.completed_breakdowns.push(exampleId);
      this.logActivity(userId, 'breakdown_completed', { conceptId, exampleId });
    }

    const mastery = conceptMasteryRepository.getOrCreateMastery(userId, conceptId);
    if (!mastery.breakdowns_completed.includes(exampleId)) {
      mastery.breakdowns_completed.push(exampleId);
      conceptMasteryRepository.saveMastery(userId, mastery);
    }

    this.recalculateConfidence(userId, conceptId);
    this.updateRecommendations(profile);
    return profile;
  }

  /**
   * Tracks user asking questions
   */
  public trackQuestionAsked(userId: string, conceptId: string): void {
    const profile = this.getOrCreateProfile(userId);
    profile.questions_asked += 1;
    learnerProfileRepository.saveProfile(profile);

    const mastery = conceptMasteryRepository.getOrCreateMastery(userId, conceptId);
    mastery.questions_asked += 1;
    conceptMasteryRepository.saveMastery(userId, mastery);

    this.logActivity(userId, 'question_asked', { conceptId });
    this.recalculateConfidence(userId, conceptId);
    this.updateRecommendations(profile);
  }

  /**
   * Adds learning study time
   */
  public addLearningTime(userId: string, minutes: number): LearnerProfile {
    const profile = this.getOrCreateProfile(userId);
    profile.learning_time += minutes;
    learnerProfileRepository.saveProfile(profile);
    return profile;
  }

  /**
   * Recalculates confidence score based on completed milestones
   */
  private recalculateConfidence(userId: string, conceptId: string): void {
    const mastery = conceptMasteryRepository.getOrCreateMastery(userId, conceptId);
    
    let confidence = 0;
    
    // 1. Completion gives a baseline of 50%
    if (mastery.completion_percentage >= 100) {
      confidence += 50;
    } else {
      confidence += Math.round(mastery.completion_percentage * 0.3); // up to 30%
    }

    // 2. Interactive breakdowns completed (+20% per breakdown, capped at 40%)
    const breakdownsCount = mastery.breakdowns_completed.length;
    confidence += Math.min(40, breakdownsCount * 20);

    // 3. Questions asked (+5% per question, capped at 10%)
    const questionsCount = mastery.questions_asked;
    confidence += Math.min(10, questionsCount * 5);

    mastery.confidence_score = Math.min(100, confidence);
    conceptMasteryRepository.saveMastery(userId, mastery);
  }

  public clear(): void {
    this.activityLogs.clear();
    try {
      if (fs.existsSync(ACTIVITIES_FILE)) {
        fs.unlinkSync(ACTIVITIES_FILE);
      }
    } catch (_) {}
  }
}

export const learningJourneyService = LearningJourneyService.getInstance();
export default learningJourneyService;
