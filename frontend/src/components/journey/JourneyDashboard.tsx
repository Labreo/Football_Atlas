import React, { useEffect } from 'react';
import { useLearningJourneyStore } from '../../stores/useLearningJourneyStore';
import { useTacticalStore } from '../../stores/useTacticalStore';
import { tacticalRegistry } from '@football-atlas/shared';

interface JourneyDashboardProps {
  onNavigateToConcept: (conceptId: string) => void;
  onNavigateToBreakdown: (exampleId: string, conceptId: string) => void;
  onNavigateToTab: (tab: 'playbook' | 'classroom') => void;
}

export const JourneyDashboard: React.FC<JourneyDashboardProps> = ({
  onNavigateToConcept,
  onNavigateToBreakdown,
  onNavigateToTab,
}) => {
  const {
    profile,
    masteries,
    paths,
    recommendations,
    activities,
    isLoading,
    error,
    loadJourney,
    startPath,
    changeDifficulty,
  } = useLearningJourneyStore();

  const { fetchConcepts } = useTacticalStore();

  useEffect(() => {
    loadJourney();
    fetchConcepts();
  }, []);

  if (isLoading && !profile) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400 font-sans">
        <div className="w-8 h-8 border-4 border-[#10B981] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs uppercase tracking-widest font-bold font-mono">Loading Tactical Journey...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center font-sans max-w-md mx-auto">
        <h3 className="text-red-500 font-bold mb-2">Error Loading Journey</h3>
        <p className="text-xs text-slate-400 mb-4">{error}</p>
        <button
          onClick={loadJourney}
          className="px-4 py-2 bg-[#182235] border border-slate-700 text-slate-300 rounded-lg hover:text-white transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!profile) return null;

  // Calculate overall metrics
  const completedConceptsCount = profile.completed_concepts.length;
  const totalConceptsCount = 10;
  const overallProgress = Math.round((completedConceptsCount / totalConceptsCount) * 100);

  // Find next concept object
  const nextConceptObj = recommendations?.next_concept_id
    ? tacticalRegistry.getConcept(recommendations.next_concept_id)
    : null;

  const handleNextStepClick = () => {
    if (recommendations?.next_concept_id) {
      onNavigateToConcept(recommendations.next_concept_id);
    }
  };

  return (
    <div className="flex-1 w-full h-full p-6 overflow-y-auto bg-[#0A0D14] flex flex-col gap-6 select-none font-sans">
      
      {/* ──────────────────────────────────────────────────────────── */}
      {/* HEADER SECTION (Learner Profile Details)                      */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#23324C]/40 pb-5">
        <div>
          <h2 className="font-display font-extrabold text-2xl tracking-wider text-slate-100 uppercase">
            My Journey
          </h2>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-xl">
            Track your concept mastery, resume curated learning paths, and explore recommended tactical lessons.
          </p>
        </div>

        {/* Difficulty Selector Pills */}
        <div className="flex items-center gap-2 bg-[#121826]/80 p-1 rounded-xl border border-[#23324C]/40 shrink-0">
          {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
            <button
              key={level}
              onClick={() => changeDifficulty(level)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                profile.difficulty_level === level
                  ? 'bg-[#10B981] text-white shadow-md shadow-[#10B981]/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* OVERALL METRICS ROW                                         */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Concepts Mastered */}
        <div className="bg-[#121826]/75 border border-[#23324C]/60 rounded-2xl p-4 shadow-lg flex flex-col justify-between h-[100px]">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Concepts Mastered</span>
          <div className="flex items-end justify-between mt-1">
            <span className="text-2xl font-extrabold text-slate-100 font-display">
              {completedConceptsCount} <span className="text-xs text-slate-500 font-medium font-sans">/ {totalConceptsCount}</span>
            </span>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
              {overallProgress}%
            </span>
          </div>
        </div>

        {/* Metric 2: Study Time */}
        <div className="bg-[#121826]/75 border border-[#23324C]/60 rounded-2xl p-4 shadow-lg flex flex-col justify-between h-[100px]">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Active Study Time</span>
          <div className="flex items-end justify-between mt-1">
            <span className="text-2xl font-extrabold text-slate-100 font-display">
              {profile.learning_time} <span className="text-xs text-slate-500 font-medium font-sans">MINS</span>
            </span>
            <span className="text-[18px] opacity-40">⏱️</span>
          </div>
        </div>

        {/* Metric 3: Active Path */}
        <div className="bg-[#121826]/75 border border-[#23324C]/60 rounded-2xl p-4 shadow-lg flex flex-col justify-between h-[100px]">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Active Learning Path</span>
          <div className="mt-1 flex flex-col justify-end h-full">
            <span className="text-xs font-bold text-slate-200 truncate font-display">
              {profile.active_path_id
                ? paths.find((p) => p.path_id === profile.active_path_id)?.title || 'Custom Path'
                : 'None Selected'}
            </span>
            <span
              onClick={() => {
                const el = document.getElementById('learning-paths-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-[9px] text-[#10B981] font-bold uppercase tracking-wider hover:underline cursor-pointer mt-1"
            >
              {profile.active_path_id ? 'Change Path' : 'Select a Path'} &rarr;
            </span>
          </div>
        </div>

        {/* Metric 4: Total Breakdowns Watched */}
        <div className="bg-[#121826]/75 border border-[#23324C]/60 rounded-2xl p-4 shadow-lg flex flex-col justify-between h-[100px]">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Tactical Breakdowns</span>
          <div className="flex items-end justify-between mt-1">
            <span className="text-2xl font-extrabold text-slate-100 font-display">
              {profile.completed_breakdowns.length} <span className="text-xs text-slate-500 font-medium font-sans">completed</span>
            </span>
            <span className="text-[18px] opacity-40">🎥</span>
          </div>
        </div>

      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* SPOTLIGHT: RECOMMENDED NEXT STEPS CARDS                     */}
      {/* ──────────────────────────────────────────────────────────── */}
      {recommendations && (recommendations.next_concept_id || recommendations.next_example_id) && (
        <div className="bg-[#121826]/70 border border-[#23324C]/60 rounded-3xl p-5 shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-5 relative overflow-hidden">
          {/* Glass glow */}
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-gradient-to-br from-[#10B981]/5 to-transparent rounded-full blur-3xl pointer-events-none" />

          {/* Left Column (Info): Next Concept */}
          <div className="lg:col-span-7 flex flex-col justify-between gap-4">
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[#10B981] text-[9px] font-extrabold uppercase tracking-widest inline-block mb-3">
                ⭐ Recommended Next Step
              </span>
              {nextConceptObj ? (
                <>
                  <h3 className="font-display font-extrabold text-lg text-slate-100 leading-snug">
                    Learn: {nextConceptObj.concept_name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed max-w-lg">
                    {recommendations.explanation}
                  </p>
                </>
              ) : (
                <>
                  <h3 className="font-display font-extrabold text-lg text-slate-100 leading-snug">
                    Continue Tactical Ingestion
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed max-w-lg">
                    {recommendations.explanation}
                  </p>
                </>
              )}
            </div>

            {nextConceptObj && (
              <div className="flex gap-3 mt-2">
                <button
                  onClick={handleNextStepClick}
                  className="px-5 py-2.5 bg-[#10B981] text-white font-display text-xs font-bold rounded-xl hover:brightness-110 shadow-lg shadow-[#10B981]/15 active:scale-95 transition-all"
                >
                  Start Concept Lesson
                </button>
                <button
                  onClick={() => onNavigateToTab('classroom')}
                  className="px-5 py-2.5 bg-[#1B253B] border border-slate-700/60 text-slate-200 font-display text-xs font-bold rounded-xl hover:text-white transition-all active:scale-95"
                >
                  Ask Granite Tutor
                </button>
              </div>
            )}
          </div>

          {/* Right Column (Visual Card): Next Match Breakdown */}
          <div className="lg:col-span-5 flex flex-col bg-[#0E1320] border border-[#23324C]/50 rounded-2xl p-4 shadow-inner justify-between gap-4">
            <div>
              <span className="text-[9px] text-blue-400 font-mono font-bold uppercase tracking-wider block">
                Recommended Breakdown
              </span>
              {recommendations.next_example_id ? (
                <>
                  <h4 className="text-xs font-bold text-slate-100 mt-1 leading-snug">
                    {recommendations.next_example_id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                    Watch the interactive 3D tactical animation sequences and study IBM Granite analysis overlays.
                  </p>
                </>
              ) : (
                <>
                  <h4 className="text-xs font-bold text-slate-100 mt-1 leading-snug">
                    No breakdowns recommended yet
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                    Select a concept to unlock historical match scenarios and sequences.
                  </p>
                </>
              )}
            </div>

            {recommendations.next_example_id && (
              <button
                onClick={() => {
                  const targetConceptId = nextConceptObj?.concept_id || 'false_9';
                  onNavigateToBreakdown(recommendations.next_example_id!, targetConceptId);
                }}
                className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-display text-[10px] font-extrabold uppercase tracking-wider rounded-lg hover:brightness-110 active:scale-95 shadow-md transition-all"
              >
                Launch 3D Match Breakdown &rarr;
              </button>
            )}
          </div>

        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* CURRICULUM: LEARNING PATHS                                   */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div id="learning-paths-section" className="flex flex-col gap-3">
        <h3 className="text-xs text-slate-500 font-mono font-bold uppercase tracking-widest">
          Curated Tactical Learning Paths
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paths.map((path) => {
            const isActive = profile.active_path_id === path.path_id;
            const completedCount = path.ordered_concepts.filter((cid) =>
              profile.completed_concepts.includes(cid)
            ).length;
            const totalCount = path.ordered_concepts.length;
            const progressPct = Math.round((completedCount / totalCount) * 100);
            const isCompleted = progressPct === 100;

            return (
              <div
                key={path.path_id}
                className={`p-4 rounded-2xl border flex flex-col justify-between gap-4 transition-all relative ${
                  isActive
                    ? 'bg-[#10B981]/5 border-[#10B981] shadow-lg shadow-[#10B981]/5'
                    : 'bg-[#121826]/50 border-[#23324C]/60 hover:border-slate-700'
                }`}
              >
                {/* Active badge */}
                {isActive && (
                  <span className="absolute top-4 right-4 bg-[#10B981] text-white text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded tracking-wider select-none">
                    Active
                  </span>
                )}
                {isCompleted && (
                  <span className="absolute top-4 right-4 bg-emerald-500/10 border border-emerald-500/35 text-emerald-400 text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded tracking-wider select-none">
                    Completed
                  </span>
                )}

                <div className="space-y-1.5">
                  <span className={`text-[8px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded border inline-block ${
                    path.difficulty === 'beginner'
                      ? 'bg-slate-900 border-slate-700 text-slate-400'
                      : path.difficulty === 'intermediate'
                      ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                  }`}>
                    {path.difficulty}
                  </span>
                  <h4 className="text-xs font-bold text-slate-100 leading-snug">
                    {path.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed max-w-[240px]">
                    {path.description}
                  </p>
                </div>

                {/* Progress & estimation */}
                <div className="space-y-2 pt-2 border-t border-[#23324C]/30">
                  <div className="flex items-center justify-between text-[9px] font-mono text-slate-500">
                    <span>{path.estimated_completion_time}m est. time</span>
                    <span className="font-bold text-slate-300">{completedCount}/{totalCount} concepts</span>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCompleted ? 'bg-emerald-500' : 'bg-gradient-to-r from-emerald-500 to-[#10B981]'
                      }`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>

                  {!isActive && !isCompleted && (
                    <button
                      onClick={() => startPath(path.path_id)}
                      className="w-full mt-2 py-1.5 border border-[#10B981]/40 hover:border-[#10B981] bg-[#10B981]/5 hover:bg-[#10B981]/15 text-[#10B981] font-display text-[9px] font-bold uppercase tracking-wider rounded-lg transition-all"
                    >
                      Activate Path
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* CONCEPT MASTERY GRID                                         */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xs text-slate-500 font-mono font-bold uppercase tracking-widest">
          Concept Mastery Board
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {masteries.map((mastery) => {
            const conceptDetails = tacticalRegistry.getConcept(mastery.concept_id);
            const isCompleted = mastery.completion_percentage === 100;
            if (!conceptDetails) return null;

            return (
              <div
                key={mastery.concept_id}
                onClick={() => onNavigateToConcept(mastery.concept_id)}
                className="p-3.5 rounded-2xl bg-[#121826]/40 border border-[#23324C]/40 hover:border-[#10B981] transition-all cursor-pointer flex flex-col justify-between gap-4 group"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-bold text-slate-500 font-mono uppercase tracking-wider">
                      {conceptDetails.category.replace('_', ' ')}
                    </span>
                    <span className={`w-2 h-2 rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                  </div>
                  <h4 className="text-xs font-bold text-slate-200 group-hover:text-[#10B981] transition-colors leading-tight font-display">
                    {conceptDetails.concept_name}
                  </h4>
                </div>

                <div className="space-y-2 pt-2 border-t border-[#23324C]/20">
                  {/* Progress Info */}
                  <div className="flex items-center justify-between text-[9px] font-mono">
                    <span className="text-slate-500">Mastery</span>
                    <span className="font-bold text-slate-300">{mastery.completion_percentage}%</span>
                  </div>
                  <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isCompleted ? 'bg-emerald-500' : 'bg-[#10B981]'
                      }`}
                      style={{ width: `${mastery.completion_percentage}%` }}
                    />
                  </div>

                  {/* Confidence rating */}
                  <div className="flex items-center justify-between text-[9px] font-mono pt-1">
                    <span className="text-slate-500">Confidence</span>
                    <span className={`font-bold ${
                      mastery.confidence_score >= 80 ? 'text-emerald-400' :
                      mastery.confidence_score >= 50 ? 'text-amber-500' :
                      'text-slate-400'
                    }`}>{mastery.confidence_score}%</span>
                  </div>

                  {/* Breakdown details */}
                  <div className="flex items-center justify-between text-[8px] text-slate-600 font-bold uppercase tracking-wider">
                    <span>Breakdowns: {mastery.breakdowns_completed.length}</span>
                    <span>Q: {mastery.questions_asked}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* RECENT ACTIVITY FEED                                        */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xs text-slate-500 font-mono font-bold uppercase tracking-widest">
          Recent Activity
        </h3>
        <div className="bg-[#121826]/40 border border-[#23324C]/60 rounded-2xl p-5 shadow-lg flex flex-col gap-4 font-mono text-[11px] text-slate-300">
          {activities.length === 0 ? (
            <div className="py-6 text-center text-slate-500 italic font-sans text-xs">
              No recent study activities recorded. Select a concept to begin!
            </div>
          ) : (
            activities.slice(0, 5).map((activity) => {
              const dateStr = new Date(activity.timestamp).toLocaleTimeString();
              let text = '';
              let badge = '';

              switch (activity.activity_type) {
                case 'concept_viewed':
                  text = `Viewed details of ${activity.concept_id?.replace(/_/g, ' ').toUpperCase()}`;
                  badge = 'VIEW';
                  break;
                case 'concept_completed':
                  text = `Completed lesson study for ${activity.concept_id?.replace(/_/g, ' ').toUpperCase()}`;
                  badge = 'COMPLETED';
                  break;
                case 'breakdown_started':
                  text = `Entered 3D tactical breakdown for ${activity.example_id?.replace(/_/g, ' ').toUpperCase()}`;
                  badge = 'START_BRK';
                  break;
                case 'breakdown_completed':
                  text = `Finished analyzing match breakdown sequence: ${activity.example_id?.replace(/_/g, ' ').toUpperCase()}`;
                  badge = 'WATCHED';
                  break;
                case 'question_asked':
                  text = `Queried Granite tutor regarding ${activity.concept_id?.replace(/_/g, ' ').toUpperCase()} tactics`;
                  badge = 'ASK_TUTOR';
                  break;
                case 'path_started':
                  text = `Activated curriculum path: ${activity.path_id?.replace(/_/g, ' ').toUpperCase()}`;
                  badge = 'PATH_START';
                  break;
                case 'path_completed':
                  text = `Completed all concepts in learning path: ${activity.path_id?.replace(/_/g, ' ').toUpperCase()}!`;
                  badge = 'PATH_DONE';
                  break;
              }

              return (
                <div key={activity.id} className="flex items-start gap-4 p-3 rounded-xl bg-[#182235]/35 border border-[#23324C]/35">
                  <span className="text-[#10B981] font-bold shrink-0">[{dateStr}]</span>
                  <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="font-sans text-slate-200">{text}</span>
                    <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400 tracking-wider shrink-0 w-fit">
                      {badge}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
};
export default JourneyDashboard;
