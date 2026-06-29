import React from 'react';
import { useTacticalStore } from '../../stores/useTacticalStore';
import { useLearningUIStore } from '../../stores/LearningUIStore';
import { learningOrchestrator } from '../../tacticalOrchestrator/orchestrator';
import { useBreakdownStore } from '../../stores/useBreakdownStore';
import { useAudioCommentaryStore } from '../../audioCommentary/useAudioCommentaryStore';
import { audioCommentaryManager } from '../../audioCommentary/AudioCommentaryManager';

const PitchControls: React.FC = () => {
  const { 
    currentConcept, 
    playState, 
    playSpeed, 
    overlays, 
    setPlayState, 
    setPlaySpeed, 
    toggleOverlay,
    cameraZoom,
    setCameraZoom,
    lang
  } = useTacticalStore();

  const { current_phase_index } = useLearningUIStore();
  
  const {
    currentBreakdown,
    currentMomentIndex,
    playbackState: breakdownPlayState,
    setMoment,
    setPlaybackState: setBreakdownPlayState,
    stopBreakdown,
  } = useBreakdownStore();

  const { enabled: audioEnabled } = useAudioCommentaryStore();

  const isBreakdownActive = !!currentBreakdown;
  const isLoaded = isBreakdownActive ? true : !!currentConcept;

  const activeModule = learningOrchestrator.getActiveModule();
  const phases = activeModule ? activeModule.getPhases() : [];

  const toggleAudio = async () => {
    if (audioEnabled) {
      audioCommentaryManager.stop();
      useAudioCommentaryStore.getState().setEnabled(false);
      return;
    }

    useAudioCommentaryStore.getState().setEnabled(true);
    audioCommentaryManager.setPlaybackSpeed(useAudioCommentaryStore.getState().playbackSpeed);
    audioCommentaryManager.setMute(useAudioCommentaryStore.getState().isMuted);
    audioCommentaryManager.setVolume(useAudioCommentaryStore.getState().volume);
    await audioCommentaryManager.play();
  };

  return (
    <div className="flex flex-col gap-4 select-none w-full">
      {/* 1. Stop-Motion Phase Navigation Timeline / Breakdown Moments */}
      {isBreakdownActive && currentBreakdown?.key_moments && (
        <div className="flex items-center gap-2 border-b border-[#1E293B]/45 pb-3">
          <span className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-widest shrink-0">
            {lang === 'es' ? 'Momentos del análisis:' : lang === 'fr' ? "Moments d'analyse:" : lang === 'de' ? 'Analyse-Momente:' : 'Breakdown Moments:'}
          </span>
          <div className="flex flex-wrap gap-1.5 items-center">
            {currentBreakdown.key_moments.map((moment: any, idx: number) => (
              <button
                key={moment.moment_id}
                onClick={() => {
                  setMoment(idx);
                  setBreakdownPlayState('paused'); // Pause to allow stop-motion inspection
                }}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wide uppercase transition-all border ${
                  currentMomentIndex === idx
                    ? 'bg-[#38FE5E]/25 border-[#38FE5E] text-[#38FE5E] shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                    : 'bg-[#111622] border-[#222E45]/60 text-slate-400 hover:text-slate-200 hover:border-slate-500'
                }`}
                title={moment.description}
              >
                {lang === 'es' ? 'Momento' : lang === 'fr' ? 'Moment' : lang === 'de' ? 'Moment' : 'Moment'} {idx + 1}: {moment.title}
              </button>
            ))}
            <button
              onClick={() => stopBreakdown()}
              className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all ml-auto"
            >
              {lang === 'es' ? '✕ Salir del análisis' : lang === 'fr' ? "✕ Quitter l'analyse" : lang === 'de' ? '✕ Analyse verlassen' : '✕ Exit Breakdown'}
            </button>
          </div>
        </div>
      )}

      {!isBreakdownActive && isLoaded && phases.length > 0 && (
        <div className="flex items-center gap-2 border-b border-[#1E293B]/45 pb-3">
          <span className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-widest shrink-0">
            {lang === 'es' ? 'Pasos de la línea de tiempo:' : lang === 'fr' ? "Étapes du fil d'actualité:" : lang === 'de' ? 'Schritte der Zeitachse:' : 'Timeline Steps:'}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {phases.map((p: any) => (
              <button
                key={p.index}
                onClick={() => {
                  learningOrchestrator.seek(p.start);
                  setPlayState('paused'); // Pause to allow stop-motion inspection
                }}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wide uppercase transition-all border ${
                  current_phase_index === p.index
                    ? 'bg-[#38FE5E]/25 border-[#38FE5E] text-[#38FE5E] shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                    : 'bg-[#111622] border-[#222E45]/60 text-slate-400 hover:text-slate-200 hover:border-slate-500'
                }`}
                title={p.description}
              >
                {lang === 'es' ? 'Fase' : lang === 'fr' ? 'Phase' : lang === 'de' ? 'Phase' : 'Phase'} {p.index}: {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 2. Main Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 w-full">
        {/* Playback Controls & Speed Group */}
        <div className="flex items-center gap-3 bg-[#111622]/85 border border-[#222E45]/40 rounded-xl p-1.5 shrink-0">
          <button
            onClick={() => {
              if (isBreakdownActive) {
                setBreakdownPlayState(breakdownPlayState === 'playing' ? 'paused' : 'playing');
              } else {
                setPlayState(playState === 'playing' ? 'paused' : 'playing');
              }
            }}
            disabled={!isLoaded}
            className={`flex items-center justify-center h-8 px-4 rounded-lg font-display text-xs font-bold transition-all ${
              (isBreakdownActive ? breakdownPlayState : playState) === 'playing'
                ? 'bg-[#00F3FF] text-[#090D14] shadow-[0_0_12px_rgba(0,243,255,0.25)] hover:brightness-110'
                : 'bg-[#182235] text-slate-200 hover:bg-[#222E45]'
            } disabled:opacity-30 disabled:cursor-not-allowed`}
          >
            {(isBreakdownActive ? breakdownPlayState : playState) === 'playing'
              ? (lang === 'es' ? '⏸ Pausar' : lang === 'fr' ? '⏸ Pause' : lang === 'de' ? '⏸ Pause' : '⏸ Pause')
              : (lang === 'es' ? '▶ Reproducir' : lang === 'fr' ? '▶ Lecture' : lang === 'de' ? '▶ Abspielen' : '▶ Play')}
          </button>

          <button
            onClick={() => {
              if (isBreakdownActive) {
                setBreakdownPlayState('stopped');
              } else {
                setPlayState('stopped');
              }
            }}
            disabled={!isLoaded}
            className="flex items-center justify-center h-8 w-8 rounded-lg bg-[#182235] text-slate-400 hover:text-slate-200 hover:bg-[#222E45] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Reset Animation"
          >
            ■
          </button>

          <div className="h-4 w-[1px] bg-[#222E45]/60" />

          {/* Speed Modifiers */}
          <div className="flex items-center gap-1">
            {([0.5, 1, 1.5, 2] as const).map((speed) => (
              <button
                key={speed}
                onClick={() => setPlaySpeed(speed)}
                disabled={!isLoaded}
                className={`h-7 px-2.5 rounded text-[11px] font-bold transition-all ${
                  playSpeed === speed
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                } disabled:opacity-30 disabled:cursor-not-allowed`}
              >
                {speed}x
              </button>
            ))}
          </div>

          <button
            onClick={toggleAudio}
            disabled={!isLoaded}
            className={`h-8 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all ${
              audioEnabled
                ? 'bg-[#38FE5E]/15 border border-[#38FE5E] text-[#38FE5E]'
                : 'bg-[#182235] border border-transparent text-slate-400 hover:text-slate-200'
            } disabled:opacity-30 disabled:cursor-not-allowed`}
          >
            {audioEnabled
              ? (lang === 'es' ? 'Audio Activo' : lang === 'fr' ? 'Audio Activé' : lang === 'de' ? 'Audio Ein' : 'Audio On')
              : (lang === 'es' ? 'Audio Desactivo' : lang === 'fr' ? 'Audio Désactivé' : lang === 'de' ? 'Audio Aus' : 'Audio Off')}
          </button>
        </div>

        {/* Camera Zoom Control Slider (Always active/accessible) */}
        <div className="flex items-center gap-2.5 bg-[#111622]/85 border border-[#222E45]/40 rounded-xl h-11 px-3.5 shrink-0">
          <span className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-widest">
            {lang === 'es' ? 'Zoom' : lang === 'fr' ? 'Zoom' : lang === 'de' ? 'Zoom' : 'Zoom'}
          </span>
          <input
            type="range"
            min="0.5"
            max="2.5"
            step="0.05"
            value={cameraZoom}
            onChange={(e) => setCameraZoom(parseFloat(e.target.value))}
            className="horizontal-zoom-slider"
          />
          <span className="text-[10px] text-[#38FE5E] font-mono w-8 text-right font-extrabold">
            {cameraZoom.toFixed(2)}x
          </span>
        </div>

        {/* Visual Overlay Toggles */}
        <div className="flex items-center gap-2 bg-[#111622]/85 border border-[#222E45]/40 rounded-xl p-1.5 shrink-0">
          <button
            onClick={() => toggleOverlay('passingLanes')}
            disabled={!isLoaded}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide border transition-all ${
              overlays.passingLanes
                ? 'bg-slate-800 border-[#00F3FF] text-[#00F3FF] shadow-[0_0_8px_rgba(0,243,255,0.15)]'
                : 'bg-[#182235] border-transparent text-slate-400 hover:text-slate-200'
            } disabled:opacity-30 disabled:cursor-not-allowed`}
          >
            {lang === 'es' ? 'Líneas de pase' : lang === 'fr' ? 'Lignes de passe' : lang === 'de' ? 'Passwege' : 'Passing Lanes'}
          </button>

          <button
            onClick={() => toggleOverlay('movementPaths')}
            disabled={!isLoaded}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide border transition-all ${
              overlays.movementPaths
                ? 'bg-slate-800 border-[#39FF14] text-[#39FF14] shadow-[0_0_8px_rgba(57,255,20,0.15)]'
                : 'bg-[#182235] border-transparent text-slate-400 hover:text-slate-200'
            } disabled:opacity-30 disabled:cursor-not-allowed`}
          >
            {lang === 'es' ? 'Rutas de movimiento' : lang === 'fr' ? 'Trajectoires' : lang === 'de' ? 'Bewegungspfade' : 'Movement Paths'}
          </button>

          <button
            onClick={() => toggleOverlay('pressingZones')}
            disabled={!isLoaded}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide border transition-all ${
              overlays.pressingZones
                ? 'bg-slate-800 border-[#FF0055] text-[#FF0055] shadow-[0_0_8px_rgba(255,0,85,0.15)]'
                : 'bg-[#182235] border-transparent text-slate-400 hover:text-slate-200'
            } disabled:opacity-30 disabled:cursor-not-allowed`}
          >
            {lang === 'es' ? 'Zonas tácticas' : lang === 'fr' ? 'Zones tactiques' : lang === 'de' ? 'Taktik-Zonen' : 'Tactical Zones'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PitchControls;
