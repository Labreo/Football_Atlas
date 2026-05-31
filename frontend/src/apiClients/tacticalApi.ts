import { TacticalConcept, TutorResponse, ConversationTurn } from '@football-atlas/shared';

const API_BASE = 'http://localhost:3001/api/tactical';

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

  async askTutor(prompt: string, history: ConversationTurn[]): Promise<TutorResponse> {
    const res = await fetch(`${API_BASE}/tutor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt, history })
    });
    if (!res.ok) throw new Error('Failed to query tactical tutor');
    return res.json();
  }
};
