import { create } from 'zustand';
import { LearnerProfile, ConceptMastery, LearningPath, LearningRecommendations, ActivityLog } from '@football-atlas/shared';
import { tacticalApi } from '../apiClients/tacticalApi';

interface LearningJourneyState {
  profile: LearnerProfile | null;
  masteries: ConceptMastery[];
  paths: LearningPath[];
  recommendations: LearningRecommendations | null;
  activities: ActivityLog[];
  isLoading: boolean;
  error: string | null;

  loadJourney: () => Promise<void>;
  startPath: (pathId: string) => Promise<void>;
  completeConcept: (conceptId: string) => Promise<void>;
  completeBreakdown: (conceptId: string, exampleId: string) => Promise<void>;
  trackConceptView: (conceptId: string) => Promise<void>;
  changeDifficulty: (level: 'beginner' | 'intermediate' | 'advanced') => Promise<void>;
  addStudyTime: (minutes: number) => Promise<void>;
}

let timerInstance: ReturnType<typeof setInterval> | null = null;

export const useLearningJourneyStore = create<LearningJourneyState>((set, get) => {
  return {
    profile: null,
    masteries: [],
    paths: [],
    recommendations: null,
    activities: [],
    isLoading: false,
    error: null,

    loadJourney: async () => {
      set({ isLoading: true, error: null });
      try {
        const [profile, masteries, paths, recommendations, activities] = await Promise.all([
          tacticalApi.getJourneyProfile(),
          tacticalApi.getJourneyMasteries(),
          tacticalApi.getJourneyPaths(),
          tacticalApi.getJourneyRecommendations(),
          tacticalApi.getJourneyActivities(),
        ]);

        set({
          profile,
          masteries,
          paths,
          recommendations,
          activities,
          isLoading: false,
        });

        // Initialize study time tracker if not running
        if (!timerInstance) {
          timerInstance = setInterval(() => {
            get().addStudyTime(1);
          }, 60000); // every minute
        }
      } catch (err: any) {
        set({ error: err.message || 'Failed to load journey details', isLoading: false });
      }
    },

    startPath: async (pathId: string) => {
      try {
        const updatedProfile = await tacticalApi.startJourneyPath(pathId);
        const recommendations = await tacticalApi.getJourneyRecommendations();
        const activities = await tacticalApi.getJourneyActivities();
        set({ profile: updatedProfile, recommendations, activities });
      } catch (err: any) {
        set({ error: err.message || 'Failed to start learning path' });
      }
    },

    completeConcept: async (conceptId: string) => {
      try {
        const updatedProfile = await tacticalApi.completeConcept(conceptId);
        const masteries = await tacticalApi.getJourneyMasteries();
        const recommendations = await tacticalApi.getJourneyRecommendations();
        const activities = await tacticalApi.getJourneyActivities();
        set({ profile: updatedProfile, masteries, recommendations, activities });
      } catch (err: any) {
        set({ error: err.message || 'Failed to complete concept' });
      }
    },

    completeBreakdown: async (conceptId: string, exampleId: string) => {
      try {
        const updatedProfile = await tacticalApi.completeBreakdown(conceptId, exampleId);
        const masteries = await tacticalApi.getJourneyMasteries();
        const recommendations = await tacticalApi.getJourneyRecommendations();
        const activities = await tacticalApi.getJourneyActivities();
        set({ profile: updatedProfile, masteries, recommendations, activities });
      } catch (err: any) {
        set({ error: err.message || 'Failed to complete breakdown' });
      }
    },

    trackConceptView: async (conceptId: string) => {
      try {
        await tacticalApi.trackConceptView(conceptId);
        const masteries = await tacticalApi.getJourneyMasteries();
        const activities = await tacticalApi.getJourneyActivities();
        const recommendations = await tacticalApi.getJourneyRecommendations();
        set({ masteries, activities, recommendations });
      } catch (_) {}
    },

    changeDifficulty: async (level: 'beginner' | 'intermediate' | 'advanced') => {
      try {
        const updatedProfile = await tacticalApi.updateJourneyProfile(level);
        const recommendations = await tacticalApi.getJourneyRecommendations();
        set({ profile: updatedProfile, recommendations });
      } catch (err: any) {
        set({ error: err.message || 'Failed to update difficulty level' });
      }
    },

    addStudyTime: async (minutes: number) => {
      try {
        const updatedProfile = await tacticalApi.addStudyTime(minutes);
        set({ profile: updatedProfile });
      } catch (_) {}
    },
  };
});
