import React, { useEffect } from 'react';
import { useBreakdownStore } from '../../stores/useBreakdownStore';
import { analyticsTracker } from '../../tacticalOrchestrator/analytics';
import { audioCommentaryManager } from '../../audioCommentary/AudioCommentaryManager';

interface HistoricalBreakdownModeProps {
  onNavigateToConcept: (conceptId: string) => void;
}

export const HistoricalBreakdownMode: React.FC<HistoricalBreakdownModeProps> = ({ onNavigateToConcept }) => {
  const {
    currentExample,
    currentBreakdown,
    currentMomentIndex,
    playbackState,
    learningMode,
    timelineProgress,
    isLoading,
    error,
    setMoment,
    replayMoment,
    setPlaybackState,
    setLearningMode,
    stopBreakdown,
    applyCameraPreset,
  } = useBreakdownStore();

  // Removed useTacticalStore selectConcept call

  // If a breakdown is completed or progress exceeds a moment, sync active views
  useEffect(() => {
    if (currentBreakdown) {
      const activeMoment = currentBreakdown.key_moments[currentMomentIndex];
      if (activeMoment) {
        applyCameraPreset(activeMoment.camera_view);
      }
    }
  }, [currentMomentIndex, currentBreakdown]);

  useEffect(() => {
    if (!currentBreakdown) return;
    audioCommentaryManager.prepareHistoricalNarration();
  }, [currentBreakdown]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400 font-sans">
        <div className="w-8 h-8 border-4 border-[#00F3FF] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs uppercase tracking-widest font-bold">Analyzing Play with IBM Granite...</span>
      </div>
    );
  }

  if (error || !currentBreakdown || !currentExample) {
    return (
      <div className="p-6 text-center font-sans">
        <h3 className="text-red-500 font-bold mb-2">Error Loading Breakdown</h3>
        <p className="text-xs text-slate-400 mb-4">{error || 'Breakdown not found.'}</p>
        <button
          onClick={stopBreakdown}
          className="px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg hover:text-white transition-colors"
        >
          Return to Playbook
        </button>
      </div>
    );
  }

  const { key_moments, title, description } = currentBreakdown;
  const currentMoment = key_moments[currentMomentIndex];

  // Navigation handlers
  const handleStepForward = () => {
    if (currentMomentIndex < key_moments.length - 1) {
      setMoment(currentMomentIndex + 1);
    }
  };

  const handleStepBackward = () => {
    if (currentMomentIndex > 0) {
      setMoment(currentMomentIndex - 1);
    }
  };

  const handleConceptJump = async (relatedConceptId: string) => {
    analyticsTracker.trackRelatedConceptOpened(currentExample.concept_id || '', relatedConceptId, {
      from_example: currentExample.example_id,
    });
    // Stop the breakdown, navigate to related concept
    stopBreakdown();
    onNavigateToConcept(relatedConceptId);
  };

  return (
    <div className="flex flex-col h-full bg-[#0B0F19]/95 text-slate-200 font-sans border-l border-slate-800/80 shadow-2xl overflow-y-auto">
      {/* 1. Header with back button */}
      <div className="p-4 border-b border-slate-800/60 bg-[#0F1424]/40 flex items-center justify-between">
        <button
          onClick={stopBreakdown}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white font-medium transition-colors"
        >
          <span>←</span>
          <span>Exit Breakdown</span>
        </button>
        <div className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/25 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
          Breakdown Mode
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col gap-6">
        {/* Match / Sequence Metadata */}
        <div>
          <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase tracking-wider">
            {currentExample.competition} • {currentExample.season}
          </span>
          <h2 className="text-lg font-bold font-display text-white mt-1 leading-snug">
            {title}
          </h2>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            {description}
          </p>
        </div>

        {/* 2. Mode Toggle (Guided vs Free) */}
        <div className="grid grid-cols-2 p-1 bg-[#13192B] rounded-xl border border-slate-800/80">
          <button
            onClick={() => setLearningMode('guided')}
            className={`py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
              learningMode === 'guided'
                ? 'bg-[#1D4ED8] text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Guided Play
          </button>
          <button
            onClick={() => setLearningMode('free')}
            className={`py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
              learningMode === 'free'
                ? 'bg-[#1D4ED8] text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Free Explore
          </button>
        </div>

        {/* Mode Information Card */}
        <div className="px-3 py-2.5 bg-[#121826]/80 border border-slate-800/50 rounded-xl text-[11px] text-slate-400 leading-relaxed shadow-inner select-none animate-fadeIn">
          {learningMode === 'guided' ? (
            <p>
              <strong className="text-emerald-400 font-bold">Guided Mode:</strong> The sequence plays continuously. Spanning the entire timeline, camera view changes and annotations will shift dynamically as the play unfolds.
            </p>
          ) : (
            <p>
              <strong className="text-blue-400 font-bold">Free Explore:</strong> Self-paced step-motion exploration. The play sequence will automatically pause at each key moment, allowing you to manually rotate and analyze the shape.
            </p>
          )}
        </div>

        {/* 3. Granite Narration Commentary */}
        {currentMoment && (
          <div className="p-4 rounded-xl border border-blue-900/40 bg-gradient-to-br from-blue-950/20 to-slate-900/60 shadow-lg relative overflow-hidden">
            {/* Glossy overlay */}
            <div className="absolute top-0 right-0 p-2 text-[9px] font-mono text-blue-400 font-extrabold uppercase tracking-widest bg-blue-500/10 border-l border-b border-blue-900/40 rounded-bl-lg select-none">
              Granite Analyst
            </div>
            <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-2 font-bold">
              Narration Point {currentMomentIndex + 1}
            </div>
            <p className="text-xs text-slate-300 italic leading-relaxed">
              "{currentMoment.granite_context}"
            </p>
            {currentMoment.annotations.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5 items-center">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mr-1">Overlays:</span>
                {currentMoment.annotations.map((ann, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700/80 text-slate-400 text-[9px] font-medium"
                  >
                    {ann.type.replace('_', ' ')}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 4. Playback Controller Controls */}
        <div className="flex flex-col gap-3 bg-[#13192B]/85 border border-slate-800/80 p-4 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Play Timeline</span>
            <span className="font-bold text-emerald-400">{(timelineProgress * 100).toFixed(0)}%</span>
          </div>

          {/* Scrub-free Custom Timeline Slider */}
          <div className="relative h-2 w-full bg-slate-800 rounded-full overflow-hidden select-none">
            <div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-emerald-500 to-[#00F3FF] transition-all duration-300"
              style={{ width: `${timelineProgress * 100}%` }}
            />
            {/* Moment Markers */}
            {key_moments.map((mom, idx) => (
              <button
                key={mom.moment_id}
                onClick={() => setMoment(idx)}
                style={{ left: `${mom.timestamp * 100}%` }}
                className={`absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border border-slate-900 transition-transform hover:scale-125 ${
                  idx === currentMomentIndex ? 'bg-[#00F3FF]' : 'bg-slate-400'
                }`}
                title={mom.title}
              />
            ))}
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleStepBackward}
                disabled={currentMomentIndex === 0}
                className="w-8 h-8 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-center hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition-colors"
                title="Previous Moment"
              >
                ◀
              </button>
              <button
                onClick={() => setPlaybackState(playbackState === 'playing' ? 'paused' : 'playing')}
                className={`px-4 h-8 rounded-lg font-bold text-xs uppercase tracking-wide flex items-center justify-center transition-all ${
                  playbackState === 'playing'
                    ? 'bg-amber-500 text-slate-950 hover:brightness-110 shadow-lg'
                    : 'bg-[#00F3FF] text-slate-950 hover:brightness-110 shadow-lg shadow-[#00F3FF]/10'
                }`}
              >
                {playbackState === 'playing' ? 'Pause' : 'Play Sequence'}
              </button>
              <button
                onClick={handleStepForward}
                disabled={currentMomentIndex === key_moments.length - 1}
                className="w-8 h-8 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-center hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition-colors"
                title="Next Moment"
              >
                ▶
              </button>
            </div>

            <button
              onClick={() => replayMoment(currentMomentIndex)}
              className="px-3 h-8 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-white bg-slate-800/60 border border-slate-700/60 rounded-lg transition-colors"
            >
              Replay Moment
            </button>
          </div>
        </div>

        {/* 5. Key Events Timeline List */}
        <div className="flex flex-col gap-3">
          <h3 className="text-xs text-slate-500 font-mono font-bold uppercase tracking-widest">
            Tactical Key Moments
          </h3>
          <div className="flex flex-col gap-2.5">
            {key_moments.map((mom, idx) => {
              const isActive = idx === currentMomentIndex;
              return (
                <div
                  key={mom.moment_id}
                  onClick={() => setMoment(idx)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-950/15 border-emerald-500/80 shadow-[0_0_12px_rgba(16,185,129,0.06)]'
                      : 'bg-[#111624]/60 border-slate-800 hover:border-slate-700 hover:bg-[#131A2D]/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-emerald-400 font-semibold">
                      Moment {idx + 1} • {(mom.timestamp * 100).toFixed(0)}%
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/50">
                      🎥 {mom.camera_view.replace('_', ' ')}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white mt-1.5">
                    {mom.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    {mom.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 6. Concept Connections References */}
        {currentExample.concept_id && (
          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80">
            <h3 className="text-xs text-slate-500 font-mono font-bold uppercase tracking-widest mb-3">
              Concept References
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleConceptJump(currentExample.concept_id)}
                className="px-3 py-1.5 rounded-lg bg-[#111624] border border-slate-800 hover:border-blue-500 text-slate-300 text-xs font-medium hover:text-white transition-all"
              >
                Core Lesson: {currentExample.concept_id.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </button>
              {currentExample.tags && currentExample.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800/40 text-slate-500 text-xs"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 7. Historical Context Details */}
        <div className="rounded-xl border border-slate-800/60 p-4 bg-[#111624]/20 text-[11px] text-slate-400 leading-relaxed flex flex-col gap-2">
          <div className="text-slate-500 font-mono font-bold uppercase tracking-widest text-[9px] mb-1">
            Historical Play Context
          </div>
          <div>
            <strong className="text-slate-300">Manager:</strong> {currentExample.coach}
          </div>
          <div>
            <strong className="text-slate-300">Key Personnel:</strong> {currentExample.players.join(', ')}
          </div>
          <div className="border-t border-slate-800/40 pt-2 mt-1">
            {currentExample.tactical_summary}
          </div>
        </div>
      </div>
    </div>
  );
};
