import { TacticalConcept, TutorResponse, ConversationTurn, HistoricalExample, HistoricalBreakdown, AudienceMode, HistoricalEvidence } from '@football-atlas/shared';
import { TACTICAL_API_BASE as API_BASE } from './apiBase';

export const tacticalApi = {
  async getConcepts(): Promise<TacticalConcept[]> {
    const res = await fetch(`${API_BASE}/concepts`);
    if (!res.ok) throw new Error('Failed to fetch tactical concepts');
    return res.json();
  },

  async getConceptById(id: string): Promise<TacticalConcept> {
    const res = await fetch(`${API_BASE}/concepts/${id}`);
    if (!res.ok) throw new Error(`Failed to fetch concept: ${id}`);
    return res.json();
  },

  async askTutor(
    prompt: string,
    history: ConversationTurn[],
    audienceMode?: AudienceMode,
    lang?: string
  ): Promise<TutorResponse> {
    const res = await fetch(`${API_BASE}/tutor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, history, audience_mode: audienceMode, lang })
    });
    if (!res.ok) throw new Error('Failed to query tactical tutor');
    return res.json();
  },


  async uploadDocument(formData: FormData): Promise<any> {
    const res = await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(err.message || 'Upload failed');
    }
    return res.json();
  },

  async getDocuments(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/documents`);
    if (!res.ok) throw new Error('Failed to fetch documents');
    return res.json();
  },

  async getDocumentChunks(id: string): Promise<any[]> {
    const res = await fetch(`${API_BASE}/documents/${id}/chunks`);
    if (!res.ok) throw new Error('Failed to fetch document chunks');
    return res.json();
  },

  async getConceptChunks(conceptId: string): Promise<any[]> {
    const res = await fetch(`${API_BASE}/concepts/${conceptId}/chunks`);
    if (!res.ok) throw new Error('Failed to fetch concept chunks');
    return res.json();
  },

  async searchKeyword(query: string): Promise<any[]> {
    const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error('Search failed');
    return res.json();
  },

  async getHistoricalExamplesByConcept(conceptId: string, complexity?: string, exclude?: string[]): Promise<HistoricalExample[]> {
    const params = new URLSearchParams();
    if (complexity) params.append('complexity', complexity);
    if (exclude && exclude.length > 0) params.append('exclude', exclude.join(','));
    const res = await fetch(`${API_BASE}/historical/concepts/${conceptId}?${params.toString()}`);
    if (!res.ok) throw new Error(`Failed to fetch historical examples for concept: ${conceptId}`);
    return res.json();
  },

  async getHistoricalExampleById(exampleId: string): Promise<HistoricalExample> {
    const res = await fetch(`${API_BASE}/historical/examples/${exampleId}`);
    if (!res.ok) throw new Error(`Failed to fetch historical example: ${exampleId}`);
    return res.json();
  },

  async searchHistoricalExamples(filters: { coach?: string; team?: string; player?: string }): Promise<HistoricalExample[]> {
    const params = new URLSearchParams();
    if (filters.coach) params.append('coach', filters.coach);
    if (filters.team) params.append('team', filters.team);
    if (filters.player) params.append('player', filters.player);
    const res = await fetch(`${API_BASE}/historical/search?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to search historical examples');
    return res.json();
  },

  async getHistoricalBreakdown(exampleId: string): Promise<HistoricalBreakdown> {
    const res = await fetch(`${API_BASE}/historical/breakdowns/${exampleId}`);
    if (!res.ok) throw new Error(`Failed to fetch historical breakdown for example: ${exampleId}`);
    return res.json();
  },

  async getHistoricalEvidence(exampleId: string): Promise<HistoricalEvidence[]> {
    const res = await fetch(`${API_BASE}/historical/evidence/${exampleId}`);
    if (!res.ok) throw new Error(`Failed to fetch evidence for example: ${exampleId}`);
    return res.json();
  },

  async translateTexts(texts: string[], targetLang: string): Promise<{ translatedTexts: string[] }> {
    const res = await fetch(`${API_BASE}/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts, targetLang })
    });
    if (!res.ok) throw new Error('Failed to translate texts');
    return res.json();
  },
};

