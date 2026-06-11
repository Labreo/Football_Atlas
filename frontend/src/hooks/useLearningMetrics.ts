/**
 * useLearningMetrics.ts
 * ──────────────────────
 * React hook that polls the /api/metrics/dashboard endpoint
 * and exposes the aggregated DashboardMetrics to any component.
 *
 * Also provides `trackLearningEvent` — a thin wrapper that
 * POSTs a single LearningEvent to /api/metrics/events and
 * refreshes the local cache.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// ─── Types (mirrors backend service) ────────────────────────────────────────

export interface DashboardMetrics {
  comprehension_rate: number;
  comprehension_pass_count: number;
  comprehension_total_sessions: number;
  followup_engagement_rate: number;
  followup_engaged_count: number;
  followup_total_sessions: number;
  avg_conversation_depth: number;
  casual_fan_sessions: number;
  tactical_student_sessions: number;
  casual_fan_comprehension_rate: number;
  tactical_student_comprehension_rate: number;
  sample_size: number;
  confidence_note: string;
  breakdown_launch_rate: number;
  top_concepts: { concept_id: string; comprehension_rate: number; sessions: number }[];
  score_distribution: Record<string, number>;
  time_series: { date: string; comprehension_rate: number; sessions: number }[];
  computed_at: string;
}

export type LearningEventType =
  | 'concept_started'
  | 'concept_completed'
  | 'followup_asked'
  | 'breakdown_launched'
  | 'concept_recalled'
  | 'understanding_scored';

export interface TrackEventPayload {
  session_id: string;
  event_type: LearningEventType;
  concept_id?: string;
  audience_mode?: 'CASUAL_FAN' | 'TACTICAL_STUDENT';
  payload?: Record<string, unknown>;
}

const apiHost = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE_HOST || '';
const API_BASE = apiHost
  ? `${apiHost.replace(/\/$/, '')}/api/metrics`
  : '/api/metrics';

// ─── Hook ────────────────────────────────────────────────────────────────────

interface UseLearningMetricsReturn {
  metrics: DashboardMetrics | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  trackLearningEvent: (event: TrackEventPayload) => Promise<void>;
}

export function useLearningMetrics(pollIntervalMs = 30_000): UseLearningMetricsReturn {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/dashboard`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: DashboardMetrics = await res.json();
      setMetrics(data);
      setError(null);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch + polling
  useEffect(() => {
    fetchMetrics();
    intervalRef.current = setInterval(fetchMetrics, pollIntervalMs);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchMetrics, pollIntervalMs]);

  const trackLearningEvent = useCallback(
    async (event: TrackEventPayload) => {
      try {
        await fetch(`${API_BASE}/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event),
        });
        // Refresh metrics after event ingestion
        await fetchMetrics();
      } catch (err) {
        console.warn('[LearningMetrics] Failed to track event:', err);
      }
    },
    [fetchMetrics],
  );

  return {
    metrics,
    loading,
    error,
    refresh: fetchMetrics,
    trackLearningEvent,
  };
}
