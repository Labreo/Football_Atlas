# Developer & Extension Guide

This document provides a guide for future developers and maintainers on how to extend the Football Atlas playbook, animations, grounding documents, and AI features.

---

## 1. Directory Tree & Codebase Layout

```
Football_Atlas/
├── shared/                         # Shared utilities & interfaces
│   └── src/
│       ├── types/                  # Core type contracts
│       ├── schemas/                # Zod schemas
│       └── registry.ts             # Central concept definitions
├── backend/                        # Express API & Grounded Services
│   └── src/
│       ├── documents/              # Ingested Docling publications
│       ├── repositories/           # Historical examples DB (static JSON seeds)
│       ├── routes/                 # Express API endpoints
│       └── services/               # Granite grounding & index search logic
└── frontend/                       # React App & WebGL Pitch
    └── src/
        ├── components/
        │   ├── chat/               # Classroom chat interface
        │   └── common/             # Evidence panel drawers
        ├── stores/                 # Zustand state stores
        ├── tacticalEngine/         # Three.js canvas & custom shaders
        └── visualLanguage/         # TVLS event signature specifications
```

---

## 2. Walkthrough: Adding a New Tactical Concept

To introduce a new concept (e.g. *"Inverted Winger"*):

### Step 1: Declare in the Shared Registry
Open [registry.ts](../shared/src/registry.ts) and add the concept definition:
```typescript
tacticalRegistry.registerConcept({
  concept_id: 'inverted_winger',
  concept_name: 'Inverted Winger',
  category: 'attacking_roles',
  complexity: ComplexityLevel.INTERMEDIATE,
  core_explanation: 'A winger who cuts inside on their opposite foot...',
  key_principles: [
    { title: 'Inward Penetration', description: 'Driving centrally to drag fullbacks...' }
  ],
  related_concepts: ['false_9']
});
```

### Step 2: Define Language Vocabulary for Granite
In [vocabulary.service.ts](../backend/src/services/vocabulary.service.ts), register keyword maps in multiple languages so Granite resolves user queries containing related terms:
```typescript
conceptVocabularyService.registerKeywords('inverted_winger', 'en', [
  'inverted winger', 'cut inside', 'opposite foot', 'inside run', 'half-space attack'
]);
```

### Step 3: Implement the 3D Animation Coordinates Module
In the frontend, create `frontend/src/conceptRuntime/modules/InvertedWingerModule.ts` implementing the player coordinate paths and custom overlays. Register the module in [registry.ts](../frontend/src/tacticalOrchestrator/registry.ts).

---

## 3. Walkthrough: Adding a Historical Match Example

### Step 1: Add to Example Repository
Open [historicalExample.repository.ts](../backend/src/repositories/historicalExample.repository.ts). Insert a new record containing tagging metadata (concept, players, coach, team, season):
```typescript
{
  example_id: 'robben_bayern_2013',
  concept_id: 'inverted_winger',
  match_name: 'Bayern Munich vs Borussia Dortmund (2013)',
  coach: 'Jupp Heynckes',
  season: '2012-2013',
  competition: 'Champions League Final',
  teams: ['Bayern Munich', 'Borussia Dortmund'],
  players: ['Arjen Robben', 'Franck Ribery'],
  description: 'Arjen Robben cuts inside from the right wing to score the winning goal...',
  tactical_summary: 'Robben exploits the half-space...',
  beginner_friendly: true,
  confidence_rating: 0.95
}
```

### Step 2: Ingest a Docling Source Document
Place a tactical analysis document (Markdown or PDF) detailing this match in [backend/src/documents/](../backend/src/documents/). The document ingestion pipeline will automatically parse, chunk, and index this document. The `GroundedExampleService` will automatically scan, score, and link these chunks as grounded evidence for the example next time it is loaded!

---

## 4. API Endpoint Index

*   **`GET /api/tactical/concepts`**: Returns all registered concepts.
*   **`GET /api/tactical/concepts/:id`**: Returns details for a specific concept.
*   **`POST /api/tactical/tutor`**: Processes conversational classroom turns.
    *   *Request body*: `{ prompt: string, history: ConversationTurn[] }`
    *   *Response*: `TutorResponse` (including explanation, resolved concept, user level, and action buttons).
*   **`GET /api/tactical/historical/concepts/:id`**: Retrieves examples for a concept.
*   **`GET /api/tactical/historical/evidence/:exampleId`**: Retrieves supporting evidence chunks from Docling for an example.
