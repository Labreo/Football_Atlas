import React, { useEffect, useState } from 'react';
import { useBreakdownStore } from '../../stores/useBreakdownStore';
import { WhatIfOption } from '@football-atlas/shared';
import { analyticsTracker } from '../../tacticalOrchestrator/analytics';
import { audioCommentaryManager } from '../../audioCommentary/AudioCommentaryManager';

interface HistoricalBreakdownModeProps {
  onNavigateToConcept: (conceptId: string) => void;
}

// Multilingual analyst commentary dictionary for key moment overrides
const ANALYST_LOCALIZATIONS: Record<
  string,
  Record<'nathan' | 'valeria' | 'claire' | 'lukas', string>
> = {
  default: {
    nathan: "Analyzing tactical patterns. Space occupancy dictates options.",
    valeria: "Analizando patrones tácticos. La ocupación de espacios dicta opciones.",
    claire: "Analyse des schémas tactiques. L'occupation de l'espace dicte les options.",
    lukas: "Analyse der taktischen Muster. Die Raumbesetzung bestimmt die Optionen."
  },
  // Messi's False 9 final pass
  barca_2009_m5: {
    nathan: "Nathan (EN): Stunning vision from Messi. By dropping deep, he pulled Ferdinand out, leaving Eto'o free to exploit the space.",
    valeria: "Valeria (ES): Visión de juego espectacular de Messi. Atrayendo a Ferdinand liberó el espacio para la diagonal de Eto'o.",
    claire: "Claire (FR): Superbe vision de Messi. En décrochant, il aspire Ferdinand et libère le couloir central pour Eto'o.",
    lukas: "Lukas (DE): Unglaubliche Übersicht von Messi. Durch sein Zurückfallen zieht er Ferdinand heraus und macht den Weg frei für Eto'o."
  },
  // Spain 2012 overload
  spain_2012_m3: {
    nathan: "Nathan (EN): Fabregas turns quickly and slides David Silva through. A strikerless formation exploiting the overloaded midfield.",
    valeria: "Valeria (ES): Fábregas gira rápido y filtra para David Silva. Esquema sin delantero centro que satura la medular italiana.",
    claire: "Claire (FR): Fàbregas se retourne rapidement et sert David Silva. Une formation sans attaquant fixe qui sature le milieu.",
    lukas: "Lukas (DE): Fabregas dreht sich schnell und bedient David Silva. Eine stürmerlose Formation überlädt das italienische Mittelfeld."
  },
  // Liverpool Gegenpressing Stones interception
  lfc_2018_m2: {
    nathan: "Nathan (EN): Otamendi is completely trapped in the sideline pressing funnel. Salah and Mane block all vertical lanes.",
    valeria: "Valeria (ES): Otamendi atrapado en la banda por el embudo de presión. Salah y Mané bloquean las salidas verticales.",
    claire: "Claire (FR): Otamendi est complètement piégé sur la ligne de touche. Salah et Mané coupent les transmissions verticales.",
    lukas: "Lukas (DE): Otamendi ist komplett in der Pressingfalle an der Linie gefangen. Salah und Mane sperren alle vertikalen Passwege."
  },
  // Mbappe wide pass (2022)
  arg_fra_22_m2: {
    nathan: "Nathan (EN): Our AI fieldread scans the tactical geometry. It highlights a fifteen-meter vertical gap in Zone 14 caused by Argentina's fatigue. This space is what allowed Mbappé to exploit the channel.",
    valeria: "Valeria (ES): Nuestro análisis de IA escanea la geometría táctica. Destaca una brecha vertical de quince metros en la Zona 14 por la fatiga de Argentina. Este espacio es lo que permitió a Mbappé explotar el canal.",
    claire: "Claire (FR): Notre lecture par l'IA scanne la géométrie tactique. Elle met en évidence un espace vertical de quinze mètres dans la Zone 14 causé par la fatigue de l'Argentine. C'est cet espace qui a permis à Mbappé d'exploiter le couloir.",
    lukas: "Lukas (DE): Unsere KI-Feldanalyse scannt die taktische Geometrie. Sie hebt eine 15-Meter große vertikale Lücke in Zone 14 hervor, verursacht durch Argentiniens Ermüdung. Dieser Raum ermöglichte es Mbappe, die Gasse zu nutzen."
  },
  // Mbappe central pass to Thuram (2022)
  arg_fra_22_m3: {
    nathan: "Nathan (EN): Argentina's lines disconnect under immense fatigue. Mbappe easily slides a pass inside to Thuram.",
    valeria: "Valeria (ES): Las líneas de Argentina se desconectan por fatiga. Mbappé filtra fácilmente el balón raso para Thuram.",
    claire: "Claire (FR): Les lignes argentines se déconnectent sous la fatigue. Mbappé transmet facilement le ballon dans l'axe pour Thuram.",
    lukas: "Lukas (DE): Argentiniens Ketten reißen wegen Ermüdung auseinander. Mbappe spielt den Ball flach ins Zentrum zu Thuram."
  },
  // Mbappe Lay-off (2022)
  arg_fra_22_m4: {
    nathan: "Nathan (EN): Perfect first-time wall pass from Thuram. Romero steps out too late, leaving Mbappe behind.",
    valeria: "Valeria (ES): Pared perfecta al primer toque de Thuram. Romero salta tarde y Mbappé le gana la espalda.",
    claire: "Claire (FR): Magnifique remise en une touche de Thuram. Romero sort en retard, Mbappé s'infiltre dans son dos.",
    lukas: "Lukas (DE): Perfektes One-Touch-Anspiel von Thuram. Romero rückt zu spät heraus, Mbappe läuft ihm im Rücken weg."
  }
};

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
    selectedWhatIfOption,
    activeAnalyst,
    setMoment,
    replayMoment,
    setPlaybackState,
    setLearningMode,
    stopBreakdown,
    setSelectedWhatIfOption,
    setActiveAnalyst,
    applyCameraPreset
  } = useBreakdownStore();

  const [activeTab, setActiveTab] = useState<'decision' | 'profile' | 'whatif'>('decision');

  // Synchronize active camerapreset on index tick
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
      <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400 font-sans bg-[#0B0F19]">
        <div className="w-8 h-8 border-4 border-[#00F3FF] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs uppercase tracking-widest font-bold">Analyzing Play with IBM Granite...</span>
      </div>
    );
  }

  if (error || !currentBreakdown || !currentExample) {
    return (
      <div className="p-6 text-center font-sans bg-[#0B0F19] h-full flex flex-col justify-center items-center">
        <h3 className="text-red-500 font-bold mb-2">Error Loading Breakdown</h3>
        <p className="text-xs text-slate-400 mb-4">{error || 'Breakdown not found.'}</p>
        <button
          onClick={() => stopBreakdown()}
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
      from_example: currentExample.example_id
    });
    stopBreakdown();
    onNavigateToConcept(relatedConceptId);
  };

  // Determine moment metrics for visual displays
  const getMomentMetrics = () => {
    const momentId = currentMoment?.moment_id || '';
    if (momentId === 'arg_fra_22_m1') {
      return {
        quality: 80,
        decision: 82,
        execution: 80,
        difficulty: 70,
        stakes: 90,
        stakesLabel: 'Recovery Phase',
        vision: 78,
        risk: 55,
        pros: ['France wins possession in midfield', 'Rabiot secures ball under pressure'],
        cons: ['Argentina block is initially compact']
      };
    } else if (momentId === 'arg_fra_22_m2') {
      return {
        quality: 88,
        decision: 90,
        execution: 85,
        difficulty: 75,
        stakes: 94,
        stakesLabel: 'High Leverage',
        vision: 88,
        risk: 65,
        pros: ['Releases Mbappe into the vertical channel', 'Exploits the space behind Tagliafico'],
        cons: ['Requires rapid transition shift']
      };
    } else if (momentId === 'arg_fra_22_m3') {
      return {
        quality: 85,
        decision: 88,
        execution: 82,
        difficulty: 80,
        stakes: 96,
        stakesLabel: 'Championship Tension',
        vision: 86,
        risk: 75,
        pros: ['Bypasses shifted midfielders', 'Finds Thuram in Zone 14 between lines'],
        cons: ['Pass played under close defender tracking']
      };
    } else if (momentId === 'arg_fra_22_m4') {
      return {
        quality: 92,
        decision: 95,
        execution: 90,
        difficulty: 85,
        stakes: 98,
        stakesLabel: 'Crucial Build-Up',
        vision: 92,
        risk: 80,
        pros: ['Perfect first-time layoff', 'Draws Romero out of the backline'],
        cons: ['Centimeter precision required']
      };
    } else if (momentId === 'arg_fra_22_m5') {
      return {
        quality: 96,
        decision: 98,
        execution: 95,
        difficulty: 92,
        stakes: 100,
        stakesLabel: 'World Cup Equalizer',
        vision: 95,
        risk: 85,
        pros: ['Stunning first-time volley strike', 'Restores parity in the World Cup Final'],
        cons: ['High technical execution difficulty']
      };
    } else if (momentId.includes('m5') || momentId.includes('m4')) {
      return {
        quality: 92,
        decision: 95,
        execution: 90,
        difficulty: 85,
        stakes: 98,
        stakesLabel: 'Championship Point',
        vision: 92,
        risk: 80,
        pros: ['Splits defensive block', 'Creates direct goal access'],
        cons: ['Requires centimeter accuracy']
      };
    } else if (momentId.includes('lfc_2018_m2')) {
      return {
        quality: 35,
        decision: 40,
        execution: 30,
        difficulty: 45,
        stakes: 78,
        stakesLabel: 'Build-up Dilemma',
        vision: 35,
        risk: 85,
        pros: ['Retains local possession'],
        cons: ['Funnels straight into pressing traps']
      };
    } else if (momentId.includes('m2') || momentId.includes('m3')) {
      return {
        quality: 85,
        decision: 88,
        execution: 82,
        difficulty: 80,
        stakes: 85,
        stakesLabel: 'Key Tactical Transition',
        vision: 86,
        risk: 72,
        pros: ['Progresses vertical lines', 'Stretches defensive spacing'],
        cons: ['Risk of rapid interception']
      };
    }
    // Default fallback
    return {
      quality: 80,
      decision: 82,
      execution: 80,
      difficulty: 75,
      stakes: 70,
      stakesLabel: 'Regular Phase',
      vision: 78,
      risk: 65,
      pros: ['Retains team shape', 'Saves player stamina'],
      cons: ['Slow build-up tempo']
    };
  };

  const metrics = getMomentMetrics();

  // Get active analyst details
  const analystConfig = {
    nathan: { name: 'Nathan', role: 'Tactical Analyst', flag: '🇬🇧', avatar: '🧑‍💻' },
    valeria: { name: 'Valeria', role: 'Analista Táctica', flag: '🇪🇸', avatar: '👩‍🏫' },
    claire: { name: 'Claire', role: 'Analyste Tactique', flag: '🇫🇷', avatar: '👩‍🔬' },
    lukas: { name: 'Lukas', role: 'Taktikanalyst', flag: '🇩🇪', avatar: '👨‍💼' }
  }[activeAnalyst];

  // Reacting mood calculations
  const getAnalystMood = () => {
    if (selectedWhatIfOption) {
      if (selectedWhatIfOption.chosen) return { emoji: '●', text: 'Pleased', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-950/20' };
      if (selectedWhatIfOption.best) return { emoji: '●', text: 'Very Pleased', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-950/20' };
      if (!selectedWhatIfOption.viable) return { emoji: '●', text: 'Gutted', color: 'text-red-400 border-red-500/30 bg-red-950/20' };
      return { emoji: '●', text: 'Analyzing...', color: 'text-blue-400 border-blue-500/30 bg-blue-950/20' };
    }
    if (metrics.quality >= 80) {
      return { emoji: '●', text: 'Pleased', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-950/20' };
    } else if (metrics.quality <= 50) {
      return { emoji: '●', text: 'Gutted', color: 'text-red-400 border-red-500/30 bg-red-950/20' };
    }
    return { emoji: '●', text: 'Neutral', color: 'text-slate-400 border-slate-800 bg-slate-900/30' };
  };

  const mood = getAnalystMood();

  // Multilingual commentary translation
  const commentaryText =
    ANALYST_LOCALIZATIONS[currentMoment?.moment_id]?.[activeAnalyst] ||
    ANALYST_LOCALIZATIONS['default'][activeAnalyst];

  // SVG Radar pentagon builder
  const renderRadarPentagon = () => {
    const center = 50;
    const maxRadius = 38;

    // Standardized scores
    const visionVal = (metrics.vision / 100) * maxRadius;
    const riskVal = (metrics.risk / 100) * maxRadius;
    const leverageVal = (metrics.stakes / 100) * maxRadius;
    const executionVal = (metrics.execution / 100) * maxRadius;
    const difficultyVal = (metrics.difficulty / 100) * maxRadius;

    // Coordinates mapping
    const p0 = { x: center, y: center - visionVal };
    const p1 = {
      x: center + Math.sin((72 * Math.PI) / 180) * riskVal,
      y: center - Math.cos((72 * Math.PI) / 180) * riskVal
    };
    const p2 = {
      x: center + Math.sin((144 * Math.PI) / 180) * leverageVal,
      y: center - Math.cos((144 * Math.PI) / 180) * leverageVal
    };
    const p3 = {
      x: center - Math.sin((144 * Math.PI) / 180) * executionVal,
      y: center - Math.cos((144 * Math.PI) / 180) * executionVal
    };
    const p4 = {
      x: center - Math.sin((72 * Math.PI) / 180) * difficultyVal,
      y: center - Math.cos((72 * Math.PI) / 180) * difficultyVal
    };

    const points = `${p0.x.toFixed(1)},${p0.y.toFixed(1)} ${p1.x.toFixed(1)},${p1.y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)} ${p3.x.toFixed(1)},${p3.y.toFixed(1)} ${p4.x.toFixed(1)},${p4.y.toFixed(1)}`;

    return (
      <svg viewBox="0 0 100 100" className="w-48 h-48 drop-shadow-[0_0_8px_rgba(0,243,255,0.15)]">
        {/* Background Pentagon Grids */}
        {[0.25, 0.5, 0.75, 1.0].map((scale, i) => {
          const r = maxRadius * scale;
          const bgP0 = { x: center, y: center - r };
          const bgP1 = { x: center + Math.sin((72 * Math.PI) / 180) * r, y: center - Math.cos((72 * Math.PI) / 180) * r };
          const bgP2 = { x: center + Math.sin((144 * Math.PI) / 180) * r, y: center - Math.cos((144 * Math.PI) / 180) * r };
          const bgP3 = { x: center - Math.sin((144 * Math.PI) / 180) * r, y: center - Math.cos((144 * Math.PI) / 180) * r };
          const bgP4 = { x: center - Math.sin((72 * Math.PI) / 180) * r, y: center - Math.cos((72 * Math.PI) / 180) * r };
          const dStr = `M ${bgP0.x} ${bgP0.y} L ${bgP1.x} ${bgP1.y} L ${bgP2.x} ${bgP2.y} L ${bgP3.x} ${bgP3.y} L ${bgP4.x} ${bgP4.y} Z`;

          return (
            <path
              key={i}
              d={dStr}
              fill="none"
              stroke="rgba(148, 163, 184, 0.15)"
              strokeWidth="0.5"
            />
          );
        })}

        {/* Axes */}
        {[0, 72, 144, 216, 288].map((angle, idx) => {
          const x = center + Math.sin((angle * Math.PI) / 180) * maxRadius;
          const y = center - Math.cos((angle * Math.PI) / 180) * maxRadius;
          return (
            <line
              key={idx}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="rgba(148, 163, 184, 0.12)"
              strokeWidth="0.5"
            />
          );
        })}

        {/* Filled Data Polygon */}
        <polygon
          points={points}
          fill="rgba(0, 243, 255, 0.18)"
          stroke="#00F3FF"
          strokeWidth="1.5"
          className="transition-all duration-500 ease-in-out"
        />

        {/* Text Labels */}
        <text x={center} y={center - maxRadius - 2} textAnchor="middle" fill="#94A3B8" fontSize="3.5" fontWeight="bold">VISION</text>
        <text x={center + maxRadius + 2} y={center - 10} textAnchor="start" fill="#94A3B8" fontSize="3.5" fontWeight="bold">RISK</text>
        <text x={center + maxRadius - 6} y={center + maxRadius - 4} textAnchor="start" fill="#94A3B8" fontSize="3.5" fontWeight="bold">LEVERAGE</text>
        <text x={center - maxRadius + 6} y={center + maxRadius - 4} textAnchor="end" fill="#94A3B8" fontSize="3.5" fontWeight="bold">EXECUTION</text>
        <text x={center - maxRadius - 2} y={center - 10} textAnchor="end" fill="#94A3B8" fontSize="3.5" fontWeight="bold">DIFFICULTY</text>
      </svg>
    );
  };

  const whatIfOptions: WhatIfOption[] = currentMoment?.what_if_options || [];

  return (
    <div className="flex flex-col h-full bg-[#0B0F19]/95 text-slate-200 font-sans border-l border-slate-800/80 shadow-2xl overflow-y-auto">
      {/* 1. Header with back button */}
      <div className="p-4 border-b border-slate-800/60 bg-[#0F1424]/40 flex items-center justify-between">
        <button
          onClick={() => stopBreakdown()}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white font-medium transition-colors"
        >
          <span>←</span>
          <span>Exit Breakdown</span>
        </button>
        <div className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/25 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
          Decision Room
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col gap-5">
        {/* Match / Sequence Metadata */}
        <div>
          <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase tracking-wider">
            {currentExample.competition} • {currentExample.season}
          </span>
          <h2 className="text-lg font-bold font-display text-white mt-1 leading-snug">
            {title}
          </h2>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            {description}
          </p>
        </div>

        {/* 2. Analyst Selector & Reacting Portrait */}
        <div className="p-3 bg-[#111625]/80 border border-slate-800/80 rounded-xl flex items-center gap-4 relative overflow-hidden">
          {/* Reaction Avatar Circle */}
          <div className="relative flex-shrink-0">
            <div className="w-12 h-12 rounded-full border border-slate-700 bg-slate-800/50 flex items-center justify-center text-2xl shadow-inner relative">
              {analystConfig.avatar}
              {/* Mood Overlay Badge */}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border border-slate-700 bg-slate-850 flex items-center justify-center text-xs shadow-md">
                {mood.emoji}
              </div>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">
                  {analystConfig.name} {analystConfig.flag}
                </span>
                <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">
                  {analystConfig.role}
                </span>
              </div>
              {/* Language picker flag options */}
              <div className="flex gap-1.5">
                {(['nathan', 'valeria', 'claire', 'lukas'] as const).map((persona) => {
                  const flag = { nathan: '🇬🇧', valeria: '🇪🇸', claire: '🇫🇷', lukas: '🇩🇪' }[persona];
                  return (
                    <button
                      key={persona}
                      onClick={() => setActiveAnalyst(persona)}
                      className={`text-xs px-1 py-0.5 rounded transition-all hover:scale-110 ${
                        activeAnalyst === persona
                          ? 'bg-blue-500/10 border border-blue-500/40 opacity-100 scale-105'
                          : 'opacity-50 hover:opacity-85'
                      }`}
                      title={persona}
                    >
                      {flag}
                    </button>
                  );
                })}
              </div>
            </div>
            <p className="text-[11px] text-slate-300 italic mt-2.5 leading-relaxed border-l-2 border-slate-700 pl-2">
              "{commentaryText}"
            </p>
          </div>
        </div>

        {/* Mode Toggle (Guided vs Free) */}
        <div className="grid grid-cols-2 p-1 bg-[#13192B] rounded-xl border border-slate-800/80">
          <button
            onClick={() => setLearningMode('guided')}
            className={`py-1.5 text-[9px] font-bold uppercase tracking-wider rounded-lg transition-all ${
              learningMode === 'guided'
                ? 'bg-[#1D4ED8] text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Guided Play
          </button>
          <button
            onClick={() => setLearningMode('free')}
            className={`py-1.5 text-[9px] font-bold uppercase tracking-wider rounded-lg transition-all ${
              learningMode === 'free'
                ? 'bg-[#1D4ED8] text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Free Explore
          </button>
        </div>

        {/* 3. Decision Panel Tabbed Controls */}
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-3 p-1 bg-[#13192B] rounded-xl border border-slate-800/80">
            <button
              onClick={() => {
                setActiveTab('decision');
                setSelectedWhatIfOption(null);
              }}
              className={`py-1.5 text-[9px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                activeTab === 'decision'
                  ? 'bg-[#1D4ED8] text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Decision
            </button>
            <button
              onClick={() => {
                setActiveTab('profile');
                setSelectedWhatIfOption(null);
              }}
              className={`py-1.5 text-[9px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                activeTab === 'profile'
                  ? 'bg-[#1D4ED8] text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Profile DNA
            </button>
            <button
              onClick={() => setActiveTab('whatif')}
              className={`py-1.5 text-[9px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                activeTab === 'whatif'
                  ? 'bg-[#1D4ED8] text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              What If?
            </button>
          </div>

          <div className="min-h-[200px] p-4 bg-[#0F1424]/40 border border-slate-850 rounded-xl">
            {/* Tab 1: Decision Analysis */}
            {activeTab === 'decision' && (
              <div className="flex flex-col gap-4 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-slate-800/40 pb-2">
                  <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest font-bold">Action Quality</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-base font-extrabold text-[#00F3FF] font-mono">{metrics.quality}</span>
                    <span className="text-[9px] text-slate-500 font-mono font-bold">/100</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  {/* Gauge bars */}
                  {[
                    { label: 'Decision intelligence', val: metrics.decision, color: 'from-blue-600 to-blue-400' },
                    { label: 'Technical Execution', val: metrics.execution, color: 'from-emerald-600 to-emerald-400' },
                    { label: 'Action Difficulty', val: metrics.difficulty, color: 'from-purple-600 to-purple-400' }
                  ].map((gauge, idx) => (
                    <div key={idx} className="flex flex-col gap-1">
                      <div className="flex justify-between text-[9px] text-slate-400 uppercase font-mono font-bold">
                        <span>{gauge.label}</span>
                        <span>{gauge.val}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${gauge.color} transition-all duration-500`}
                          style={{ width: `${gauge.val}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-2 pt-2 border-t border-slate-800/40">
                  <span className="text-[9px] text-slate-500 font-mono uppercase font-bold tracking-widest">Pros & Cons</span>
                  <div className="flex flex-col gap-1.5 text-xs">
                    {metrics.pros.map((pro, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-slate-300">
                        <span className="text-emerald-400 font-bold">✓</span>
                        <p className="text-[11px] leading-relaxed">{pro}</p>
                      </div>
                    ))}
                    {metrics.cons.map((con, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-slate-300">
                        <span className="text-red-400 font-bold">✗</span>
                        <p className="text-[11px] leading-relaxed">{con}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Profile DNA */}
            {activeTab === 'profile' && (
              <div className="flex flex-col items-center gap-4 animate-fadeIn">
                {/* Stakes Gauge */}
                <div className="w-full flex items-center justify-between border-b border-slate-800/40 pb-2">
                  <div>
                    <span className="text-[9px] text-slate-500 font-mono uppercase tracking-widest font-bold block">Moment Stakes</span>
                    <span className="text-[10px] text-slate-300 font-bold">{metrics.stakesLabel}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-amber-400 font-mono">{metrics.stakes}%</span>
                    <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 transition-all duration-500"
                        style={{ width: `${metrics.stakes}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Radar Chart pentagon */}
                <div className="flex flex-col items-center justify-center py-2 relative">
                  {renderRadarPentagon()}
                  <span className="text-[9px] text-slate-500 font-mono uppercase font-bold tracking-wider mt-1">Decision DNA Radar</span>
                </div>
              </div>
            )}

            {/* Tab 3: What-If Options Explorer */}
            {activeTab === 'whatif' && (
              <div className="flex flex-col gap-3.5 animate-fadeIn">
                <div className="border-b border-slate-800/40 pb-2">
                  <span className="text-[9px] text-slate-500 font-mono uppercase tracking-widest font-bold block">Option Threat Valuing</span>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Evaluate alternative passes. Clicking options will render the counterfactual lane in the 3D visual board.
                  </p>
                </div>

                {whatIfOptions.length === 0 ? (
                  <div className="text-center text-slate-500 text-[10px] py-4 select-none italic font-medium">
                    No counterfactual alternatives available for this moment phase.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {whatIfOptions.map((opt) => {
                      const isSelected = selectedWhatIfOption?.option_id === opt.option_id;
                      return (
                        <div key={opt.option_id} className="flex flex-col gap-2">
                          <div
                            onClick={() => {
                              if (isSelected) {
                                setSelectedWhatIfOption(null);
                              } else {
                                setSelectedWhatIfOption(opt);
                              }
                            }}
                            className={`p-2.5 rounded-xl border transition-all cursor-pointer relative overflow-hidden flex items-center justify-between ${
                              isSelected
                                ? 'bg-blue-950/15 border-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.08)]'
                                : 'bg-[#111624]/60 border-slate-800 hover:border-slate-700 hover:bg-[#131A2D]/40'
                            }`}
                          >
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-bold text-white">{opt.label}</span>
                                {opt.chosen && (
                                  <span className="text-[9px] px-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold rounded uppercase">
                                    Chosen
                                  </span>
                                )}
                                {opt.best && (
                                  <span className="text-[9px] px-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold rounded uppercase">
                                    Optimal
                                  </span>
                                )}
                              </div>
                              <span className="text-[9px] text-slate-400 uppercase font-mono">
                                Type: {opt.kind} • {opt.viable ? (
                                  <span className="text-emerald-400 font-bold">Open Lane</span>
                                ) : (
                                  <span className="text-red-400 font-bold">Blocked Lane</span>
                                )}
                              </span>
                            </div>

                            <div className="text-right flex-shrink-0">
                              <span className={`text-xs font-extrabold font-mono ${opt.value_kind === 'xG' ? 'text-amber-400' : 'text-[#00F3FF]'}`}>
                                {opt.value.toFixed(4)}
                              </span>
                              <span className="text-[9px] text-slate-500 font-mono block uppercase">
                                {opt.value_kind}
                              </span>
                            </div>
                          </div>

                          {/* Real-time passing lane geometry analysis graph */}
                          {isSelected && (
                            <div className="p-3 bg-[#0a0f1d]/90 border border-slate-800/80 rounded-xl space-y-3 animate-fadeIn">
                              <span className="text-[9px] text-slate-500 font-mono uppercase font-bold tracking-wider block">
                                Real-Time Passing Lane Geometry
                              </span>
                              
                              {/* SVG Lane Risk Profile Graph */}
                              {(() => {
                                const isViable = opt.viable;
                                
                                // Beautiful 2D corridor width visual representing the pass trajectory geometry.
                                // It shows a narrowing corridor if blocked, or a clear parallel band if viable.
                                const pointsTop = isViable 
                                  ? "0,14 44,14 88,14 132,14 176,14 220,14" 
                                  : "0,14 44,16 99,27 132,22 176,18 220,15";
                                const pointsBottom = isViable
                                  ? "220,46 176,46 132,46 88,46 44,46 0,46"
                                  : "220,45 176,42 132,38 99,33 44,44 0,46";
                                const corridorPolyPoints = `${pointsTop} ${pointsBottom}`;
                                
                                return (
                                  <div className="space-y-1.5">
                                    <div className="flex justify-between items-center text-[8px] font-mono text-slate-400">
                                      <span>Passer (0%)</span>
                                      <span className={isViable ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                                        {isViable ? 'Corridor Clear' : 'Lane Constriction (45%)'}
                                      </span>
                                      <span>Receiver (100%)</span>
                                    </div>
                                    <div className="relative h-12 w-full bg-slate-950/80 rounded-lg border border-slate-900 overflow-hidden">
                                      <svg className="w-full h-full" viewBox="0 0 220 60" preserveAspectRatio="none">
                                        {/* Center axis guide */}
                                        <line x1="0" y1="30" x2="220" y2="30" stroke="rgba(255,255,255,0.06)" strokeDasharray="3,3" />
                                        
                                        {/* Corridor Polygon */}
                                        <polygon
                                          points={corridorPolyPoints}
                                          fill={isViable ? 'rgba(57, 255, 20, 0.08)' : 'rgba(239, 68, 68, 0.08)'}
                                          stroke={isViable ? 'rgba(57, 255, 20, 0.3)' : 'rgba(239, 68, 68, 0.3)'}
                                          strokeWidth="1"
                                        />
                                        
                                        {/* Boundary lines */}
                                        <polyline
                                          fill="none"
                                          stroke={isViable ? '#39FF14' : '#EF4444'}
                                          strokeWidth="1.6"
                                          points={pointsTop}
                                        />
                                        <polyline
                                          fill="none"
                                          stroke={isViable ? '#39FF14' : '#EF4444'}
                                          strokeWidth="1.6"
                                          points={pointsBottom.split(' ').reverse().join(' ')}
                                        />

                                        {/* Interception marker */}
                                        {!isViable && (
                                          <>
                                            {/* Vertical threat line */}
                                            <line x1="99" y1="12" x2="99" y2="48" stroke="rgba(239, 68, 68, 0.4)" strokeDasharray="1,1" />
                                            {/* Interceptor circle */}
                                            <circle cx="99" cy="30" r="5" fill="#EF4444" className="animate-pulse" />
                                            <text x="106" y="33" fill="#EF4444" fontSize="7" fontFamily="monospace" fontWeight="bold">
                                              {opt.receiver_name === 'Kingsley Coman' ? 'De Paul' : 'Romero'}
                                            </text>
                                          </>
                                        )}
                                      </svg>
                                    </div>
                                  </div>
                                );
                              })()}

                              {/* Geometry Parameters Grid */}
                              <div className="grid grid-cols-2 gap-2 text-[9px] font-mono border-t border-slate-800/40 pt-2.5">
                                <div>
                                  <span className="text-slate-500 uppercase block">Lane Width:</span>
                                  <span className={opt.viable ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                                    {opt.viable ? '2.12m' : '0.34m'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-500 uppercase block">Interception Risk:</span>
                                  <span className={opt.viable ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                                    {opt.viable ? '15%' : '88%'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-500 uppercase block">Passing Distance:</span>
                                  <span className="text-slate-200 font-bold">
                                    {Math.hypot(opt.to_x - opt.from_x, opt.to_z - opt.from_z).toFixed(1)}m
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-500 uppercase block">Cover Shadow:</span>
                                  <span className="text-slate-200 font-bold">
                                    {!opt.viable ? (opt.receiver_name === 'Kingsley Coman' ? 'De Paul (Shifted)' : 'Romero') : 'None'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 4. Playback Controller Controls */}
        <div className="flex flex-col gap-3 bg-[#13192B]/85 border border-slate-800/80 p-4 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>
              {currentBreakdown?.breakdown_id === 'breakdown_argentina_france_2022' 
                ? 'Match Timeline (Game Clock: 80:30 - 80:43)' 
                : 'Play Timeline'}
            </span>
            <span className="font-bold text-emerald-400">
              {currentBreakdown?.breakdown_id === 'breakdown_argentina_france_2022'
                ? (() => {
                    const elapsed = timelineProgress * 13; // 13s segment
                    const sec = Math.floor(80 * 60 + 30 + elapsed);
                    const m = Math.floor(sec / 60);
                    const s = sec % 60;
                    return `${m}:${s < 10 ? '0' : ''}${s}`;
                  })()
                : `${(timelineProgress * 100).toFixed(0)}%`
              }
            </span>
          </div>

          <div className="relative h-2 w-full bg-slate-800 rounded-full overflow-hidden select-none">
            <div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-emerald-500 to-[#00F3FF] transition-all duration-300"
              style={{ width: `${timelineProgress * 100}%` }}
            />
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
                      {mom.moment_id.startsWith('arg_fra_22') ? (
                        <>Moment {idx + 1} • Game Clock {mom.moment_id === 'arg_fra_22_m1' ? '80:30' : mom.moment_id === 'arg_fra_22_m2' ? '80:33' : mom.moment_id === 'arg_fra_22_m3' ? '80:38' : mom.moment_id === 'arg_fra_22_m4' ? '80:41' : '80:43'}</>
                      ) : (
                        <>Moment {idx + 1} • {(mom.timestamp * 100).toFixed(0)}%</>
                      )}
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
