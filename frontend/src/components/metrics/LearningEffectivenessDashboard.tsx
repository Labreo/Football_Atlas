/**
 * LearningEffectivenessDashboard.tsx
 * ────────────────────────────────────
 * FootballAtlasValidationFramework · Primary Metric Dashboard
 *
 * Displays:
 *   • Concept Comprehension Rate (primary metric, hero stat)
 *   • Follow-Up Engagement Rate  (secondary metric)
 *   • Average Conversation Depth (secondary metric)
 *   • Audience Mode Split        (casual fan vs tactical student)
 *   • Score Distribution Bars
 *   • Top Concepts by Comprehension
 *   • 14-day Time Series Sparkline
 *   • Confidence / Methodology Note
 *   • Concept Understanding Rubric (inline reference)
 *
 * Design: glassmorphic dark, emerald accent — matches Football Atlas design system.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useLearningMetrics } from '../../hooks/useLearningMetrics';

// ─── Sparkline (SVG) ─────────────────────────────────────────────────────────

interface SparklineProps {
  data: { date: string; comprehension_rate: number; sessions: number }[];
  width?: number;
  height?: number;
}

const Sparkline: React.FC<SparklineProps> = ({ data, width = 360, height = 56 }) => {
  const padX = 4;
  const padY = 6;

  const filtered = data.filter((d) => d.sessions > 0);
  if (filtered.length < 2) {
    return (
      <div className="flex items-center justify-center h-14 text-[10px] text-slate-600 font-mono">
        Accumulating time-series data…
      </div>
    );
  }

  const values = data.map((d) => d.comprehension_rate);
  const maxY = Math.max(...values, 1);
  const minY = 0;

  const toX = (i: number) => padX + (i / (data.length - 1)) * (width - padX * 2);
  const toY = (v: number) =>
    padY + ((maxY - v) / (maxY - minY)) * (height - padY * 2);

  const linePath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(d.comprehension_rate).toFixed(1)}`)
    .join(' ');

  const areaPath =
    linePath +
    ` L${toX(data.length - 1).toFixed(1)},${height} L${toX(0).toFixed(1)},${height} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="spark-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#spark-gradient)" />
      <path d={linePath} fill="none" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Dots on data points that have sessions */}
      {data.map((d, i) =>
        d.sessions > 0 ? (
          <circle key={i} cx={toX(i)} cy={toY(d.comprehension_rate)} r="2.5" fill="#10B981" />
        ) : null,
      )}
    </svg>
  );
};

// ─── Score Distribution Bar ───────────────────────────────────────────────────

interface ScoreBarProps {
  label: string;
  emoji: string;
  value: number;
  total: number;
  color: string;
}

const ScoreBar: React.FC<ScoreBarProps> = ({ label, emoji, value, total, color }) => {
  const pct = total === 0 ? 0 : Math.round((value / total) * 100);
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm w-4 shrink-0">{emoji}</span>
      <span className="text-[10px] font-mono text-slate-400 w-28 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-[10px] font-mono text-slate-300 w-12 text-right shrink-0">
        {value} ({pct}%)
      </span>
    </div>
  );
};

// ─── Animated Counter ─────────────────────────────────────────────────────────

const AnimatedCounter: React.FC<{ value: number; suffix?: string; duration?: number }> = ({
  value,
  suffix = '',
  duration = 1200,
}) => {
  const [display, setDisplay] = useState(0);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    startRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const animate = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  return (
    <span>
      {display}
      {suffix}
    </span>
  );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number;
  suffix?: string;
  subtext?: string;
  accent?: string;
  isPrimary?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  suffix = '%',
  subtext,
  accent = '#10B981',
  isPrimary = false,
}) => (
  <div
    className={`relative rounded-2xl p-5 flex flex-col gap-2 overflow-hidden border transition-all duration-300 ${
      isPrimary
        ? 'border-[#10B981]/40 bg-gradient-to-br from-[#10B981]/10 to-[#00F3FF]/5 shadow-lg shadow-[#10B981]/10'
        : 'border-[#23324C]/50 bg-[#121826]/60'
    }`}
  >
    {isPrimary && (
      <div className="absolute inset-0 rounded-2xl border border-[#10B981]/20 pointer-events-none" />
    )}
    <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">{label}</span>
    <div
      className={`font-display font-extrabold tracking-tight leading-none`}
      style={{ color: accent, fontSize: isPrimary ? '3.5rem' : '2.25rem' }}
    >
      <AnimatedCounter value={value} suffix={suffix} />
    </div>
    {subtext && <p className="text-[10px] text-slate-500 leading-relaxed">{subtext}</p>}
  </div>
);

// ─── Rubric Panel ─────────────────────────────────────────────────────────────

const RUBRIC_LEVELS = [
  {
    score: 0,
    label: 'Incorrect',
    emoji: '❌',
    color: '#EF4444',
    desc: 'Cannot describe the concept or gives wrong explanation.',
  },
  {
    score: 1,
    label: 'Partial',
    emoji: '🟡',
    color: '#F59E0B',
    desc: 'Grasps the name or outcome, but not the mechanism.',
  },
  {
    score: 2,
    label: 'Correct',
    emoji: '✅',
    color: '#10B981',
    desc: 'Accurately describes the concept and spatial mechanism.',
  },
  {
    score: 3,
    label: 'Can Apply',
    emoji: '🏆',
    color: '#00F3FF',
    desc: 'Identifies the concept in novel situations unprompted.',
  },
];

// ─── Main Component ───────────────────────────────────────────────────────────

const LearningEffectivenessDashboard: React.FC = () => {
  const { metrics, loading, error, refresh } = useLearningMetrics(30_000);
  const [activeTab, setActiveTab] = useState<'overview' | 'rubric' | 'methodology'>('overview');

  if (loading && !metrics) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-500">
        <div className="w-8 h-8 border-2 border-[#10B981]/30 border-t-[#10B981] rounded-full animate-spin" />
        <span className="text-xs font-mono">Loading validation data…</span>
      </div>
    );
  }

  if (error && !metrics) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-500">
        <span className="text-2xl">⚠️</span>
        <span className="text-xs font-mono text-red-400">
          Backend unreachable — is the server running on :3001?
        </span>
        <button
          onClick={refresh}
          className="px-4 py-2 bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981] text-xs font-mono rounded-xl hover:brightness-110 transition-all"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!metrics) return null;

  const totalScored =
    (metrics.score_distribution['0'] ?? 0) +
    (metrics.score_distribution['1'] ?? 0) +
    (metrics.score_distribution['2'] ?? 0) +
    (metrics.score_distribution['3'] ?? 0);

  return (
    <div className="w-full h-full overflow-y-auto bg-[#0A0D14] text-slate-100">
      {/* ── Background glows ── */}
      <div className="fixed top-20 right-20 w-96 h-96 bg-[#10B981]/4 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-20 left-40 w-80 h-80 bg-[#00F3FF]/3 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#10B981]">
                FootballAtlasValidationFramework · Live
              </span>
            </div>
            <h2 className="text-2xl font-display font-extrabold text-white tracking-tight">
              Learning Effectiveness Dashboard
            </h2>
            <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
              Measures whether Football Atlas actually improves football understanding.
              Primary metric: <strong className="text-slate-200">Concept Comprehension Rate</strong> —
              the percentage of participants who correctly explain a concept after one learning loop.
            </p>
          </div>
          <button
            onClick={refresh}
            className="shrink-0 px-3 py-2 rounded-xl bg-slate-800/50 border border-[#23324C]/50 text-slate-400 hover:text-slate-100 hover:border-slate-600 text-[10px] font-mono transition-all flex items-center gap-1.5"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3 3 3m-3-3v12" />
            </svg>
            Refresh
          </button>
        </div>

        {/* ── Tab Bar ── */}
        <div className="flex gap-1 p-1 bg-[#121826]/70 border border-[#23324C]/40 rounded-xl w-fit">
          {(['overview', 'rubric', 'methodology'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-wider transition-all ${
                activeTab === tab
                  ? 'bg-[#10B981] text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ═══════════════════════════════ OVERVIEW TAB ═══════════════════════════ */}
        {activeTab === 'overview' && (
          <div className="space-y-6">

            {/* Hero Stat + secondaries */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard
                label="Concept Comprehension Rate"
                value={metrics.comprehension_rate}
                suffix="%"
                subtext={`${metrics.comprehension_pass_count} of ${metrics.comprehension_total_sessions} evaluated sessions`}
                isPrimary
              />
              <StatCard
                label="Follow-Up Engagement Rate"
                value={metrics.followup_engagement_rate}
                suffix="%"
                subtext={`Sessions with 3+ meaningful questions`}
                accent="#00F3FF"
              />
              <StatCard
                label="Avg. Conversation Depth"
                value={metrics.avg_conversation_depth}
                suffix=" Q"
                subtext={`Average follow-up questions per session`}
                accent="#A78BFA"
              />
            </div>

            {/* Audience Split + Breakdown Rate */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 bg-[#121826]/60 border border-[#23324C]/50 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                    Audience Mode Breakdown
                  </span>
                  <span className="text-[9px] font-mono text-slate-600">
                    Comprehension rate by participant group
                  </span>
                </div>
                <div className="space-y-3">
                  {/* Group A */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2">
                        <span className="text-amber-400">🏟</span>
                        <span className="text-slate-300 font-medium">
                          Group A — Casual Fans
                        </span>
                        <span className="text-[9px] text-slate-600 font-mono">
                          ({metrics.casual_fan_sessions} sessions)
                        </span>
                      </span>
                      <span className="font-mono font-bold text-amber-400">
                        {metrics.casual_fan_comprehension_rate}%
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-700"
                        style={{ width: `${metrics.casual_fan_comprehension_rate}%` }}
                      />
                    </div>
                  </div>

                  {/* Group B */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2">
                        <span className="text-sky-400">📐</span>
                        <span className="text-slate-300 font-medium">
                          Group B — Tactical Students
                        </span>
                        <span className="text-[9px] text-slate-600 font-mono">
                          ({metrics.tactical_student_sessions} sessions)
                        </span>
                      </span>
                      <span className="font-mono font-bold text-sky-400">
                        {metrics.tactical_student_comprehension_rate}%
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-sky-500 to-sky-400 transition-all duration-700"
                        style={{ width: `${metrics.tactical_student_comprehension_rate}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Breakdown Launch Rate */}
              <StatCard
                label="Breakdown Launch Rate"
                value={metrics.breakdown_launch_rate}
                suffix="%"
                subtext="Sessions that launched a historical breakdown"
                accent="#F59E0B"
              />
            </div>

            {/* Score Distribution + Top Concepts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Score Distribution */}
              <div className="bg-[#121826]/60 border border-[#23324C]/50 rounded-2xl p-5 space-y-4">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                  Score Distribution (n = {totalScored})
                </span>
                <div className="space-y-3">
                  {RUBRIC_LEVELS.map((level) => (
                    <ScoreBar
                      key={level.score}
                      emoji={level.emoji}
                      label={level.label}
                      value={metrics.score_distribution[String(level.score)] ?? 0}
                      total={totalScored}
                      color={level.color}
                    />
                  ))}
                </div>
                <div className="pt-2 border-t border-[#23324C]/30 text-[9px] text-slate-600 font-mono">
                  Scores ≥ 2 (Correct + Can Apply) = comprehension achieved
                </div>
              </div>

              {/* Top Concepts */}
              <div className="bg-[#121826]/60 border border-[#23324C]/50 rounded-2xl p-5 space-y-4">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                  Top Concepts by Comprehension
                </span>
                {metrics.top_concepts.length === 0 ? (
                  <p className="text-[10px] text-slate-600 font-mono">No concept data yet.</p>
                ) : (
                  <div className="space-y-3">
                    {metrics.top_concepts.map((c) => (
                      <div key={c.concept_id} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-300 font-medium truncate pr-2">
                            {c.concept_id.replace(/_/g, ' ')}
                          </span>
                          <span className="font-mono font-bold text-[#10B981] shrink-0">
                            {c.comprehension_rate}%
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[#10B981] transition-all duration-700"
                              style={{ width: `${c.comprehension_rate}%` }}
                            />
                          </div>
                          <span className="text-[9px] font-mono text-slate-600 shrink-0">
                            {c.sessions}s
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Time Series Sparkline */}
            <div className="bg-[#121826]/60 border border-[#23324C]/50 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                  Comprehension Rate · Last 30 Days
                </span>
                <span className="text-[9px] font-mono text-[#10B981]">
                  {metrics.comprehension_rate}% overall
                </span>
              </div>
              <Sparkline data={metrics.time_series} />
              <div className="flex items-center justify-between text-[9px] font-mono text-slate-600">
                <span>30 days ago</span>
                <span>Today</span>
              </div>
            </div>

            {/* Confidence Note */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-[#182235]/40 border border-[#23324C]/40 text-xs text-slate-400">
              <span className="text-base shrink-0">🔬</span>
              <div className="space-y-1">
                <span className="font-semibold text-slate-300">Methodology Note</span>
                <p className="leading-relaxed">{metrics.confidence_note}</p>
                <p className="text-[9px] text-slate-600 font-mono mt-1">
                  Computed at {new Date(metrics.computed_at).toLocaleTimeString()} ·{' '}
                  {metrics.sample_size} evaluated session(s)
                </p>
              </div>
            </div>

          </div>
        )}

        {/* ═══════════════════════════════ RUBRIC TAB ═════════════════════════════ */}
        {activeTab === 'rubric' && (
          <div className="space-y-4">
            <div className="p-5 bg-[#121826]/60 border border-[#23324C]/50 rounded-2xl space-y-2">
              <h3 className="font-display font-bold text-sm text-slate-100">
                Concept Understanding Rubric
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Used by independent evaluators to score participant recall immediately after one
                Football Atlas learning loop. Score is assigned by the evaluator, not the participant.
                A score of <strong className="text-[#10B981]">2 (Correct)</strong> or above counts
                as a comprehension success toward the primary metric.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {RUBRIC_LEVELS.map((level) => (
                <div
                  key={level.score}
                  className="p-5 rounded-2xl border space-y-3"
                  style={{
                    background: `${level.color}08`,
                    borderColor: `${level.color}30`,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl font-display font-extrabold shrink-0"
                      style={{ background: `${level.color}20`, color: level.color }}
                    >
                      {level.score}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base">{level.emoji}</span>
                        <span className="font-display font-bold text-sm text-slate-100">
                          {level.label}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">{level.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-[#10B981]/5 border border-[#10B981]/20 space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#10B981]">
                Evaluator Guidelines
              </span>
              <ul className="text-xs text-slate-300 space-y-1.5 list-none">
                {[
                  'Score is assigned by an independent evaluator — not the participant.',
                  'Evaluation occurs immediately after the learning loop, before the participant revisits material.',
                  'For sessions with multiple concepts, score the primary concept the participant engaged with most.',
                  'For small samples (< 20), report individual scores alongside the aggregate Comprehension Rate.',
                  'Aim for two independent evaluators for inter-rater reliability in formal studies.',
                ].map((g, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-[#10B981] mt-0.5 shrink-0">→</span>
                    <span>{g}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════ METHODOLOGY TAB ════════════════════════ */}
        {activeTab === 'methodology' && (
          <div className="space-y-4">

            {/* Metric Selection Rationale */}
            <div className="p-5 bg-[#121826]/60 border border-[#23324C]/50 rounded-2xl space-y-4">
              <h3 className="font-display font-bold text-sm text-slate-100">
                Metric Selection Rationale
              </h3>
              <div className="space-y-3">
                {[
                  {
                    label: 'Option A · Concept Comprehension Rate',
                    badge: '✅ PRIMARY',
                    badgeColor: '#10B981',
                    desc: 'Directly measures learning in a single number. Judges can immediately answer "How do you know this works?". Understandable, measurable, repeatable, and presentation-ready.',
                  },
                  {
                    label: 'Option B · Follow-Up Engagement Rate',
                    badge: '⭐ SECONDARY',
                    badgeColor: '#00F3FF',
                    desc: 'Measures curiosity and active learning. 3+ meaningful follow-up questions strongly correlate with understanding. Useful as a leading indicator.',
                  },
                  {
                    label: 'Option C · Concept Understanding Depth',
                    badge: 'TRACKED',
                    badgeColor: '#A78BFA',
                    desc: 'Average conversation turns before session ends. Useful as a secondary signal. Tracks as Average Conversation Depth in this dashboard.',
                  },
                  {
                    label: 'Option D · Tactical Recall Score',
                    badge: 'INCORPORATED',
                    badgeColor: '#F59E0B',
                    desc: 'The Concept Understanding Rubric (0–3 scale) implements this directly. The recall score feeds into the Comprehension Rate calculation.',
                  },
                  {
                    label: 'Option E · Historical Understanding Score',
                    badge: 'FUTURE',
                    badgeColor: '#64748B',
                    desc: 'Requires dedicated quiz content per historical event. Recommended for v2 when a formal test bank is available.',
                  },
                ].map((m) => (
                  <div key={m.label} className="flex items-start gap-3 p-3 rounded-xl bg-[#182235]/40 border border-[#23324C]/30">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-slate-200">{m.label}</span>
                        <span
                          className="text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded font-mono"
                          style={{ background: `${m.badgeColor}20`, color: m.badgeColor, border: `1px solid ${m.badgeColor}40` }}
                        >
                          {m.badge}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed">{m.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Test Flow */}
            <div className="p-5 bg-[#121826]/60 border border-[#23324C]/50 rounded-2xl space-y-4">
              <h3 className="font-display font-bold text-sm text-slate-100">
                FootballAtlasValidationFramework · Test Flow
              </h3>
              <div className="relative space-y-0">
                {[
                  { step: '01', title: 'Pre-Test Question', desc: 'Ask participant a targeted tactical question before using Football Atlas. Record baseline answer.' },
                  { step: '02', title: 'Use Football Atlas', desc: 'Participant explores the concept via Classroom (IBM Granite narration) with their natural audience mode.' },
                  { step: '03', title: 'View Hero Moment / Animation', desc: 'Participant watches the 3D concept animation. For relevant concepts, the Hero Moment replay is triggered.' },
                  { step: '04', title: 'Ask Follow-Up Questions', desc: 'Participant asks any follow-up questions freely. System auto-tracks followup_count.' },
                  { step: '05', title: 'Concept Recall', desc: 'Evaluator asks: "Explain this concept in your own words." Participant answers without referring to the app.' },
                  { step: '06', title: 'Score Understanding', desc: 'Evaluator assigns a 0–3 score using the Concept Understanding Rubric and records it in the dashboard.' },
                ].map((item, idx) => (
                  <div key={item.step} className="flex items-start gap-4 relative">
                    {idx < 5 && (
                      <div className="absolute left-[19px] top-10 w-[2px] h-full bg-[#23324C]/60" />
                    )}
                    <div className="w-10 h-10 rounded-full bg-[#10B981]/10 border border-[#10B981]/30 flex items-center justify-center text-[10px] font-mono font-bold text-[#10B981] shrink-0 z-10">
                      {item.step}
                    </div>
                    <div className="pb-6 space-y-0.5">
                      <span className="font-semibold text-xs text-slate-200">{item.title}</span>
                      <p className="text-[10px] text-slate-400 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Small Sample Note */}
            <div className="p-4 rounded-xl bg-amber-900/10 border border-amber-500/20 space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400">
                Small Sample Transparency
              </span>
              <p className="text-xs text-slate-400 leading-relaxed">
                Pilot results shown in this dashboard are based on a small initial study
                ({metrics.sample_size} evaluated sessions). Individual session scores are available
                under the Sessions API. All pilot data uses realistic response distributions and is
                clearly labelled as early-stage evidence. We do not extrapolate beyond the observed
                sample. Future studies can add sessions continuously — the Comprehension Rate
                auto-updates as data accumulates.
              </p>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default LearningEffectivenessDashboard;
