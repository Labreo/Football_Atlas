# Football Atlas — Full README (archived)

This file contains the full-length README content moved from the repository root. It is an archive for maintainers and documentation consumers who want a deep, step-by-step description of the project, ingest processes, demo scenarios, and development notes.

---

The original long README content is preserved below for reference.

(Full content moved from `README.md` — retained verbatim for maintainers.)

-----------------------------------------------------------------

# Football Atlas — Tactical Intelligence & Learning Platform

⚽ Football Atlas helps coaches, analysts and curious fans understand the "why" behind football moments. It combines a concept-driven playbook, grounded historical examples, an interactive tactical runtime, and an AI Tactical Tutor powered by IBM Granite (watsonx.ai) and a typed MCP gateway.

---

**IBM SkillsBuild · Hackathon Submission (May 2026)**

Built with: IBM Granite · Context Forge MCP · Docling · TypeScript · React · Vite

---

## The Problem

Football is a continuous, multi-agent decision sport where a handful of seconds and a single tactical choice can decide a match. Fans see the final action but rarely get a rigorous, evidence-backed explanation of *why* it succeeded or failed. Teams have expensive tools and proprietary workflows; most learning resources are anecdotal.

Football Atlas bridges that gap: it provides a transparent, reproducible, evidence-first platform that explains tactical choices using grounded historical match examples and interactive visualisations — and it teaches using an AI tutor that reasons over real evidence rather than hallucinations.

---

## What It Does

Football Atlas is a full-stack learning and analysis platform for football tactics. Key capabilities include:

- A Concept Playbook: canonical tactical concepts (e.g. `high_press`, `counter_attack_trigger`, `false_9`) with structured manifests, vocabulary, example seeds and implementation notes.
- Grounded Historical Examples: ranked match examples with interactive breakdowns and supporting evidence chunks (sourced from docling-parsed documents and ingested videos/statistics).
- Tactical Orchestrator: a runtime that chains concept lessons, animations, and example evidence into guided lesson flows, playable on an interactive pitch.
- Docling-based Ingest & Search: ingest PDFs and Markdown into a vector-backed knowledge store, index chunks against concept vocabulary, and surface the best supporting evidence for any claim.
- AI Tactical Tutor: an IBM Granite-driven assistant that calls typed MCP tools (list_concepts, search_examples, fetch_evidence, request_breakdown) so answers are grounded, traceable, and citeable.

Bonus: Model telemetry and developer debug tools for transparency and reproducibility.

---

## Five Core Features (In Practice)

1. Strategy Map — Visualise concept activations and historical stints across matches. Filters for competition, coach, team, and player.
2. Example Explorer — Browse and open interactive breakdowns (timeline, key frames, evidence chunks) for every curated example.
3. Playbook Runtime — Launch a concept lesson that animates the moment, highlights movement lanes, and presents a narrated explanation.
4. Docling Ingest & Search — Upload PDF/MD resources and map document chunks to concepts with a relevance score so explanations remain evidence-first.
5. Granite Tutor Chat — Ask natural language questions and receive structured, tool-backed answers that quote evidence and the data they used.

---

## Why This Matters

- Decision Transparency: Replaces anecdote with verifiable evidence; coaches can justify or refine decisions with the same artifacts used to teach.
- Fan Education: Turns broadcast narrative into teachable moments with numbers, evidence and interactive visuals.
- Reproducible Learning: Lessons are tied to concept manifests and evidence chunks so learning is repeatable and measurable.

---

## AI & Technical Approach

### IBM Tools

- IBM Granite (watsonx.ai) is used as the LLM that reasons over match data and composes natural-language explanations.
- Context Forge MCP acts as the typed tool gateway: Granite invokes small, typed tools rather than free-form knowledge retrieval — eliminating hallucination risk for numeric or factual responses.

### Grounding & Evidence

- Docling parses PDFs/Markdown into segmented chunks and metadata. These chunks are indexed and mapped to concept vocabulary.
- The backend ranks examples by combined signals (vocabulary match, human curation, relevance score) before returning to the frontend or Tutor.

### Backend & Frontend

- Backend: TypeScript Express server exposing `/api/tactical/*` endpoints including concepts, historical examples, breakdowns, evidence, and MCP tooling.
- Frontend: React + Vite SPA with a performant playbook visualiser, chunk explorer, and chat UI.
- Persistence: Local JSON-backed `store.json` for quick dev iteration; production should use a managed data store when available.

---

## Architecture (high level)

```
React Frontend (Vite)  <-->  Express Backend (/api/tactical)  <-->  Knowledge Store (Docling + Chunks)
                                                      |
                                                      +--> Context Forge MCP Gateway --> IBM Granite (watsonx.ai)
                                                      |
                                                      +--> ML / heuristics ranking services
```

Key backend endpoints (examples):

- `GET /api/tactical/concepts` — returns concept manifests.
- `GET /api/tactical/historical/concepts/:id` — ranked historical examples for concept.
- `GET /api/tactical/historical/examples/:exampleId` — single example metadata.
- `GET /api/tactical/historical/breakdowns/:exampleId` — interactive breakdown payload.
- `GET /api/tactical/historical/evidence/:exampleId` — supporting evidence chunks.
- `GET /api/tactical/mcp/tools` — MCP tool list used by Granite.

---

## Project Structure (selected)

```
backend/       # TypeScript Express + docling ingestion + MCP glue
frontend/      # React + Vite SPA, playbook runtime, chat UI
shared/        # shared types, seeds, registries, schema definitions
data/          # persisted store.json and ingestion artifacts
football_atlas_docling/  # original doc sources used for seeding
```

---

## Quick Start (development)

Prerequisites:

- Node.js 18+ and npm (for frontend/backend TS dev)
- Optional: Python tooling if you run external ingest tools

1. Install dependencies

```bash
npm install
npm --prefix backend install
npm --prefix frontend install
```

2. Development run (two terminals)

```bash
# Run backend in dev mode
npm --prefix backend run dev

# Run frontend
npm --prefix frontend run dev
```

3. Build for production

```bash
npm run build:frontend
npm run build:backend
```

Notes:

- In production the frontend uses `VITE_API_BASE_URL` / `VITE_API_BASE_HOST` to proxy `/api/tactical` requests to the backend. See `frontend/vercel.json` for Vercel route rules.
- The Settings panel provides a "Reset Knowledge Store" action that calls `DELETE /api/tactical/documents` to clear `store.json` and reset docling chunk links.

---

## Ingesting Documents (Docling)

You can ingest domain PDFs/Markdown using the Explore → Ingest UI. For bulk ingestion, the repo includes a local helper at `backend/src/ingest-local.ts` which calls `POST /api/tactical/documents/upload` for each file in `football_atlas_docling/`.

Example (bulk local ingest):

```bash
# Optionally set BACKEND_URL if backend is not at localhost:3001
BACKEND_URL=http://localhost:3001 node backend/dist/ingest-local.js
```

Ingesting attaches parsed chunks to concepts and writes the persisted `data/store.json` file.

---

## Demo Scenarios (showcase)

1) Barcelona 2009 — False 9 masterclass

- Open Playbook → search `false_9` → Launch example `barcelona_2009_f9`.
- The Playbook animates the sequence, overlays passing lanes and off-ball runs, and opens a breakdown with evidence chunks and timestamps.

2) Match-winning High Press — Argentina 2022 equaliser

- Explore `high_press` examples and open the `argentina_france_2022_equaliser` example.
- The Tutor can summarise "what triggered the high press" and cite docling evidence and the exact video timestamps.

3) Tactical Tutor Counterfactual

- Ask: "What if the defending team had dropped to a low block on the equaliser sequence?"
- Granite calls MCP tools `search_examples` and `fetch_evidence`, then produces a step-by-step analysis with quantified risk and suggested countermeasures.

---

## Development & Debugging Tips

- Blank deployed page? Check `frontend/vercel.json`: the filesystem handler must appear before the SPA fallback so static assets are not intercepted.
- `401` or auth pages appearing on API responses: verify `VITE_API_BASE_HOST` and any platform-level protections on the API host (Vercel, Render). Use `curl -v` to inspect raw response bodies.
- Backend TypeScript build errors locally may be due to missing `@types/*` dev dependencies (install `@types/express`, `@types/cors`, `@types/multer` if needed for local compilation).

---

## Judging Criteria Alignment (Hackathon)

- Technical Execution: full-stack platform with typed MCP tooling and a grounded data pipeline.
- Innovation: evidence-first Tutor and orchestration between concept manifests, docling chunks, and animated lessons.
- Feasibility: local dev works end-to-end; production-ready Vercel config and simple persistent store enable quick deployment.

---

## Contributing

1. Add new concepts: create a manifest in `shared/seed` and include `concept_id`, vocabulary, and related metadata.
2. Improve docling sources: drop additional PDFs/Markdown into `football_atlas_docling/` and re-run ingest.
3. Fixes & features: open issues and submit PRs against `main`.

---

## Team & License

Built by the Football Atlas team.

License: Apache-2.0 (change as required)

---

If you'd like, I can: add badges, a short demo GIF, or a one-page Vercel deployment checklist that lists the exact `VITE_API_BASE_HOST` and environment secrets needed for production.
