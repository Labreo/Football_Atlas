import { AudienceMode } from '@football-atlas/shared';

// ─────────────────────────────────────────────────────────────────────────────
// NARRATION ADAPTER SERVICE
// Adapts explanation text and Granite system prompts for the two audience modes.
// Called by ContextForgeGateway to shape how Granite communicates.
// ─────────────────────────────────────────────────────────────────────────────

export class NarrationAdapterService {
  private static instance: NarrationAdapterService;

  private constructor() {}

  public static getInstance(): NarrationAdapterService {
    if (!NarrationAdapterService.instance) {
      NarrationAdapterService.instance = new NarrationAdapterService();
    }
    return NarrationAdapterService.instance;
  }

  // ── System Prompt Builders ──────────────────────────────────────────────────

  /**
   * Returns the audience-specific addition to the Granite system prompt.
   * This is appended to the existing prompt so no existing instructions are lost.
   */
  public buildSystemPromptAddition(mode: AudienceMode): string {
    if (mode === AudienceMode.CASUAL_FAN) {
      return `
AUDIENCE MODE: CASUAL FAN
You are speaking to a passionate football fan who loves the game emotionally.
- Focus on players, moments, stories, drama, and what made it exciting.
- Use plain, vivid football language — avoid tactical jargon.
- Explain with human relatable comparisons (e.g. "imagine being a defender chasing a shadow").
- Name the players involved and describe their actions like a pundit telling a story.
- Keep the energy high. Make it feel like a great football moment being relived.
- Structure: story → key player action → why it worked → emotional impact.`;
    }

    return `
AUDIENCE MODE: TACTICAL STUDENT
You are briefing a coaching staff or a student of the game.
- Focus on structural relationships, spatial exploitation, and decision-making mechanics.
- Use precise tactical vocabulary: reference points, half-spaces, transition triggers, numerical superiority.
- Reference zones (Zone 14, wide channels, back five), shapes (4-3-3 defensive block), and phase moments.
- Explain the cause-effect chain: what positional move forced which defensive reaction.
- Avoid emotional language. Prioritise clarity and analytical precision.
- Structure: tactical context → spatial mechanic → player role → structural consequence → countermeasure.`;
  }

  // ── Local Template Adapters (mock/offline mode) ──────────────────────────────

  /**
   * Rewrites a local-template explanation to match the target audience mode.
   * Applied when running in mock mode (no live Granite API).
   */
  public adaptExplanation(text: string, mode: AudienceMode): string {
    if (mode === AudienceMode.CASUAL_FAN) {
      return this.toCasualFanVoice(text);
    }
    return this.toTacticalStudentVoice(text);
  }

  /**
   * Adapts a historical breakdown narration paragraph.
   * Applied when the audience mode changes mid-breakdown or on load.
   */
  public adaptBreakdownNarration(narration: string, mode: AudienceMode): string {
    if (mode === AudienceMode.CASUAL_FAN) {
      return this.toCasualFanVoice(narration);
    }
    return narration; // Tactical student gets the original analytical text
  }

  // ── Private voice converters ────────────────────────────────────────────────

  /**
   * Transforms technical/neutral text toward a casual, story-driven tone.
   * Replaces tactical jargon with accessible football language.
   */
  private toCasualFanVoice(text: string): string {
    return text
      // Replace heavy jargon terms
      .replace(/\bnumerical superiority\b/gi, 'outnumbering the opposition')
      .replace(/\bhalf-space[s]?\b/gi, 'dangerous central areas')
      .replace(/\breference point[s]?\b/gi, 'target for the defenders')
      .replace(/\bpressing trigger[s]?\b/gi, 'signal to press')
      .replace(/\btransition[s]?\b/gi, 'switch from defending to attacking')
      .replace(/\bcompactness\b/gi, 'staying tight as a unit')
      .replace(/\bspatial exploitation\b/gi, 'using the space intelligently')
      .replace(/\bpositional superiority\b/gi, 'being in a better position')
      .replace(/\bdefensive reference point[s]?\b/gi, 'what the defenders focus on')
      .replace(/\bzone 14\b/gi, 'the dangerous zone just outside the penalty area')
      .replace(/\bback line\b/gi, 'defensive line')
      // Add fan-friendly framing prefix if text is long enough
      .replace(/^(#{1,4}\s+.+)$/m, (match) => match); // preserve headings as-is
  }

  /**
   * Ensures text has tactical precision — mostly a pass-through since
   * templates are already written in neutral/technical language, but
   * strips fan-voice softening if it crept in.
   */
  private toTacticalStudentVoice(text: string): string {
    return text
      .replace(/\boutnumbering the opposition\b/gi, 'numerical superiority')
      .replace(/\bdangerous central areas\b/gi, 'half-spaces')
      .replace(/\btarget for the defenders\b/gi, 'defensive reference point')
      .replace(/\bsignal to press\b/gi, 'pressing trigger')
      .replace(/\bstaying tight as a unit\b/gi, 'maintaining compactness')
      .replace(/\busing the space intelligently\b/gi, 'spatial exploitation')
      .replace(/\bbeing in a better position\b/gi, 'positional superiority');
  }

  // ── Hero Moment Comparison (2022 World Cup Final — Mbappé Equaliser) ─────────

  /**
   * Returns the Mbappé equaliser sequence explanation for both audiences.
   * Used for demo, README, and side-by-side comparison feature.
   */
  public getMbappeEquliserComparison(): {
    casual: string;
    tactical: string;
    concept: string;
    match: string;
  } {
    return {
      concept: 'france_comeback_2022',
      match: '2022 FIFA World Cup Final — France vs Argentina',
      casual: `Kylian Mbappé looked like he had no chance. Argentina were 2-0 up in the World Cup Final with just over 20 minutes left. Then everything changed.

A penalty. Mbappé stepped up and buried it — cool as you like. But instead of Argentina killing the game, France suddenly believed. Within 97 seconds, Mbappé had scored again — a bicycle kick that left everyone stunned.

That's the thing about Mbappé: defenders know what he can do, and he does it anyway. Argentina's defence went from comfortable to completely overwhelmed in under two minutes. It was the kind of moment football lives for.`,
      tactical: `Mbappé's equaliser sequence exposed a structural fragility in Argentina's defensive shape in the final 20 minutes. After the 80th-minute penalty, Argentina's back four dropped progressively deeper, conceding the half-spaces to Theo Hernandez.

The second goal — the bicycle kick — arrived from a breakdown in Argentina's transition press. As Hernandez drove forward on the left channel, the Argentine midfield failed to collapse centrally. Mbappé exploited the gap between Otamendi and Molina in the right half-space, receiving a clipped cross into the zone behind the retreating defensive line.

The key tactical failure: Argentina stopped pressing triggers after 2-0, inviting France into a positional game they were structurally dominant in.`,
    };
  }
}

export const narrationAdapterService = NarrationAdapterService.getInstance();
