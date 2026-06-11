import { AudienceMode } from '@football-atlas/shared';

// ─────────────────────────────────────────────────────────────────────────────
// AUDIENCE DETECTION ENGINE
// Classifies a user's question as either CASUAL_FAN or TACTICAL_STUDENT by
// scoring keyword signals without any external API call (zero latency).
// ─────────────────────────────────────────────────────────────────────────────

export interface AudienceDetectionResult {
  mode: AudienceMode;
  confidence: number;      // 0–1
  signals: string[];       // matched signal words/phrases
  isAutoDetected: boolean; // true when confidence ≥ threshold
}

// Minimum confidence required to trigger an automatic mode switch
const AUTO_SWITCH_THRESHOLD = 0.60;

// ── Signal tables ─────────────────────────────────────────────────────────────

const CASUAL_FAN_SIGNALS: Array<{ pattern: RegExp; weight: number; label: string }> = [
  { pattern: /why\s+did/i,            weight: 0.20, label: 'why did' },
  { pattern: /how\s+did/i,            weight: 0.15, label: 'how did' },
  { pattern: /who\s+(scored|played|won|scored|assisted)/i, weight: 0.20, label: 'player story' },
  { pattern: /why\s+was/i,            weight: 0.15, label: 'why was' },
  { pattern: /how\s+come/i,           weight: 0.15, label: 'how come' },
  { pattern: /\b(amazing|incredible|brilliant|magic|genius|wonder|outrageous)\b/i, weight: 0.25, label: 'emotion word' },
  { pattern: /\b(comeback|comeback|hero|legend|goat|moment|iconic)\b/i,           weight: 0.20, label: 'fan narrative' },
  { pattern: /\b(messi|mbapp[eé]|ronaldo|neymar|haaland|salah|henry|zidane|pele|maradona)\b/i, weight: 0.15, label: 'player name' },
  { pattern: /did\s+(they|he|she|argentina|france|barcelona|liverpool)/i,          weight: 0.15, label: 'team/player story' },
  { pattern: /\bwhy\b.{0,30}\b(win|lose|score|goal|miss)\b/i,                     weight: 0.20, label: 'result question' },
  { pattern: /\b(fun|exciting|beautiful|enjoy|watch|love)\b/i,                     weight: 0.10, label: 'entertainment' },
];

const TACTICAL_STUDENT_SIGNALS: Array<{ pattern: RegExp; weight: number; label: string }> = [
  { pattern: /\bhalf[\s-]?space\b/i,                                              weight: 0.35, label: 'half-space' },
  { pattern: /\b(structural|structure)\b/i,                                        weight: 0.30, label: 'structure' },
  { pattern: /\b(press(ing)?|press\s+trigger|counter[\s-]press)\b/i,              weight: 0.20, label: 'pressing' },
  { pattern: /\b(transition|transitions|in[\s-]possession|out[\s-]of[\s-]possession)\b/i, weight: 0.25, label: 'transition' },
  { pattern: /\b(spacing|compactness|block|low\s+block)\b/i,                      weight: 0.25, label: 'spacing/block' },
  { pattern: /\b(reference\s+point|defensive\s+line|back\s+line)\b/i,             weight: 0.35, label: 'reference point' },
  { pattern: /\b(numerical\s+(superiority|overload|advantage))\b/i,               weight: 0.35, label: 'numerical superiority' },
  { pattern: /\b(midfield\s+shape|formation|4[\s-]3[\s-]3|4[\s-]4[\s-]2|3[\s-]5[\s-]2)\b/i, weight: 0.20, label: 'formation/shape' },
  { pattern: /\b(zone\s+14|channel|corridor|spatial|space\s+creation)\b/i,        weight: 0.25, label: 'spatial zone' },
  { pattern: /\b(collapse|exploit|exposing|trigger|mechanic|system)\b/i,           weight: 0.20, label: 'tactical mechanic' },
  { pattern: /\b(defensive\s+response|marking|man[\s-]marking|zonal)\b/i,         weight: 0.25, label: 'defensive system' },
  { pattern: /\b(UEFA|coaching|analyst|tactician|setup)\b/i,                       weight: 0.15, label: 'analyst language' },
];

// ─────────────────────────────────────────────────────────────────────────────

class AudienceDetectionEngine {
  private static instance: AudienceDetectionEngine;

  private constructor() {}

  public static getInstance(): AudienceDetectionEngine {
    if (!AudienceDetectionEngine.instance) {
      AudienceDetectionEngine.instance = new AudienceDetectionEngine();
    }
    return AudienceDetectionEngine.instance;
  }

  /**
   * Analyse a question and return the most likely AudienceMode.
   * Returns the existing mode unchanged if confidence is below threshold.
   */
  public detect(
    question: string,
    currentMode: AudienceMode = AudienceMode.CASUAL_FAN
  ): AudienceDetectionResult {
    const casualScore  = this.scoreSignals(question, CASUAL_FAN_SIGNALS);
    const tacticalScore = this.scoreSignals(question, TACTICAL_STUDENT_SIGNALS);

    const casualSignals  = this.matchedLabels(question, CASUAL_FAN_SIGNALS);
    const tacticalSignals = this.matchedLabels(question, TACTICAL_STUDENT_SIGNALS);

    // Normalise scores into a 0–1 confidence value
    const total = casualScore.raw + tacticalScore.raw;

    if (total === 0) {
      // No signals detected — return current mode at low confidence
      return { mode: currentMode, confidence: 0.3, signals: [], isAutoDetected: false };
    }

    const casualConfidence  = casualScore.raw  / total;
    const tacticalConfidence = tacticalScore.raw / total;

    if (tacticalScore.raw > casualScore.raw) {
      const confidence = Math.min(tacticalConfidence + tacticalScore.bonus, 1);
      return {
        mode: AudienceMode.TACTICAL_STUDENT,
        confidence,
        signals: tacticalSignals,
        isAutoDetected: confidence >= AUTO_SWITCH_THRESHOLD,
      };
    } else {
      const confidence = Math.min(casualConfidence + casualScore.bonus, 1);
      return {
        mode: AudienceMode.CASUAL_FAN,
        confidence,
        signals: casualSignals,
        isAutoDetected: confidence >= AUTO_SWITCH_THRESHOLD,
      };
    }
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  private scoreSignals(
    text: string,
    signals: typeof CASUAL_FAN_SIGNALS
  ): { raw: number; bonus: number } {
    let raw = 0;
    let matchCount = 0;
    for (const s of signals) {
      if (s.pattern.test(text)) {
        raw += s.weight;
        matchCount++;
      }
    }
    // Bonus for multiple matching signals (corroborating evidence)
    const bonus = matchCount >= 3 ? 0.10 : matchCount >= 2 ? 0.05 : 0;
    return { raw, bonus };
  }

  private matchedLabels(
    text: string,
    signals: typeof CASUAL_FAN_SIGNALS
  ): string[] {
    return signals.filter(s => s.pattern.test(text)).map(s => s.label);
  }
}

export const audienceDetectionEngine = AudienceDetectionEngine.getInstance();
