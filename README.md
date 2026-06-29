# Football Atlas — 3D Interactive Tactical Learning Platform

> **IBM SkillsBuild AI Builders Challenge — June 2026**
> Built with IBM Granite · Context Forge MCP · IBM Docling · Three.js · React · Express

---

## The Problem

Football is a game of space, yet over five billion fans watch only the ball. When watching a live match or debating a historic World Cup play, fans and players ask the same tactical questions: **Why did momentum shift? Why was a defensive line broken? Why did a tactical system succeed or fail?**

Currently, fans and amateur players trying to understand the game are left with static chalkboards, generic YouTube video loops, or speculative punditry. The rich spatial data and tactical analysis systems used by professional clubs are locked behind multi-million-dollar paywalls. This divides the game and reduces a highly strategic, spatial sport to simple player drama, locking the analytical vocabulary of football away from the global community.

**Football Atlas bridges that gap.**

---

## What It Does

Football Atlas is a full-stack interactive tactical learning platform that translates unstructured, natural language questions into real-time, coordinate-based 3D animations, grounded in professional coaching literature and historical datasets.

### Five core features:

**1. World Cup 2022 Match Center**
A dedicated tournament dashboard reconstructing every single match of the FIFA World Cup 2022 (all 64 matches) from the group stages to the final. It features an interactive match stage selector, a canvas-drawn Momentum Timeline showing possession flow, card occurrences, and substitutions, and visual starting formations displaying active lineups and in-game adjustments.

**2. Expected Threat (xT) Decision Room**
A specialized valuation HUD rendering Action Quality scores (Decision, Execution, and Difficulty), Moment Stakes (leverage rating), and beautiful SVG Decision DNA Pentagon charts. It lets fans visualize the underlying mathematical performance of players on every single match event.

**3. What-If Option Valuing & Ghost Arrows (Counterfactual Mode)**
An interactive counterfactual browser that values every alternative pass, carry, or shot option on the pitch using Karun Singh’s 12x8 xT surface and geometric xG models. Selecting options dynamically draws green (viable) or red (blocked) ghost arrows in the viewport, showing how alternative choices would alter possession value.

**4. Multilingual Analyst Personas**
Interactive, emotive avatars—Nathan (English), Valeria (Spanish), Claire (French), and Lukas (German)—that provide localized narrative commentary. The avatars dynamically change expressions (Pleased, Neutral, Critical) and dialogue depending on the selected play outcome and match context.

**5. Conversational Classroom (AI Tutor)**
An interactive chat console powered by IBM Granite that serves as a personalized football tactics tutor. It supports natural language questions (e.g., *"Why did Romero's step forward open space for Mbappe's volley?"*), retrieving definitions, key principles, and counter-strategies, and automatically triggering corresponding 3D tactical animations.

---

## Why It Matters in Football

- **Democratizing Spatial Intelligence**: Replaces ball-watching behavior with spatial literacy, helping fans understand *compactness*, *pressing traps*, and *midfield overloads*.
- **Tactical Explainability**: Moves beyond static diagrams. In `HeroMomentMode`, users can scrub through match timelines frame-by-frame, visualizing defensive collapses and passing corridors.
- **Trust & Transparency**: Reconstructs critical matches using grounded coordinates, resolving controversial tactical choices with parsed coaching guidelines instead of speculation.
- **Dynamic Visual Language**: Converts static coaching manuals into active, reproducible 3D animations, making it easy for amateur players to apply professional tactical structures on the pitch.

---

## AI & Technical Approach

### IBM Technologies Used
- **IBM Granite (via watsonx.ai)**: Serves as the primary reasoning engine, orchestrating MCP tool chains, detecting user knowledge levels, and narrating tactical lessons.
- **Context Forge (MCP Gateway)**: Restricts the LLM to a strict, typed tool-calling contract. Granite is prohibited from fabricating tactical statistics or coordinates, mediating all data retrievals through 8 custom MCP tools.
- **IBM Docling**: Runs the document ingestion pipeline. It parses unstructured PDF, MD, and DOCX tactical playbooks, extracting complex table data and layout structures to seed the grounded knowledge base.
- **IBM Bob (AI Code Assistant)**: Assisted during development to structure TypeScript contracts, optimize 3D coordinate schemas, and verify our monorepo architecture.

### Tactical Models & MCP Tools
- **StatsBomb Ingestion Layer**: A fully automated local layer that queries public StatsBomb Open Data, extracts event tracking, maps starting lineups, resolves player coordinates in 3D, and computes Expected Threat (xT) metrics dynamically.
- **Expected Threat (xT) Engine**: Uses Karun Singh's 12x8 spatial threat grid to value every player action, calculating counterfactual "what-if" pass paths.
- **Context Forge MCP Tools (8 tools)**:
  - `get_concept_explanation`: Retrieves canonical definitions, key principles, and defensive counter-measures for a tactical concept, adapted to the user's knowledge level.
  - `trigger_animation`: Generates animation coordinate setups and visual overlay schemas for rendering on the 3D WebGL pitch.
  - `fetch_historical_example`: Searches and retrieves historical matches or performance examples matching specific concepts, players, or coaches.
  - `launch_breakdown`: Retrieves coordinate files, camera setups, and narrative timeline milestones for interactive match visualization.
  - `compose_concepts`: Generates comparative tactical relationship analyses connecting two different concepts (e.g. False 9 and Inverted Winger).
  - `assess_knowledge_level`: Analyzes user chat messages and history to calibrate tutor difficulty and response complexity.
  - `retrieve_source_evidence`: Extracts parsed evidence chunks and document excerpts grounded by IBM Docling.
  - `suggest_next_concept`: Generates recommendations for the next tactical concept to study based on prerequisites and mastery profiles.

### Key Design Decisions
- **Model-vs-Model Strategic Comparison**: Evaluates alternative decisions by passing both actual and counterfactual routes through the same spatial metrics (xT/xG), ensuring model-specific biases cancel out to report honest strategic deltas.
- **Positional Normalization**: Translates StatsBomb pitch mapping coordinates (120x80) into normalized Three.js WebGL space (-60 to 60, -40 to 40) using smooth linear interpolation for high-fidelity tactical playback.
- **Dual Audience Adaptive Language**: Runs an intent classifier that dynamically translates the output narrative into either a casual fan-focused explanation or a deep-dive analysis (e.g., highlighting Zone 14 or half-space geometries) depending on the detected learner level.

### Data
- **StatsBomb Open Data**: Reconstructs all 64 matches of the FIFA World Cup 2022 (approx. 200,000+ total events).
- **Docling Parsed Playbooks**: Unstructured tactical manuals parsed to create a chunked vector space of 10 native tactical concepts (False 9, High Press, Defensive Block, Pressing Trap, Midfield Overload, Counter-Attack Trigger, Inverted Winger, Back 3 Wing-Back System, Third Man Run, Compactness and Pressing Lines).

### Monorepo Architecture
```
React Frontend (Three.js WebGL pitch, Zustand state, dashboard view)
      │
      ├─► Positional coordinates & match data requests
      ▼
Express Backend
      ├─► /api/tactical                  → tactical.routes.ts
      ├─► /api/matches                   → match.routes.ts (StatsBomb)
      ├─► /api/chat                      → granite.routes.ts ──► granite.service.ts
      │                                                           │
      │                                            Executes tool  │
      ├─► Context Forge (MCP Gateway) ◄───────────────────────────┘
      │      ├── mcpRegistration.service.ts
      │      └── mcpServer.service.ts (exposes 8 custom tools)
      │
      └─► Data/RAG Engines
             ├── StatsBomb API Parser & xT Engine
             └── IBM Docling Ingestion (tactical PDFs)
```

---

## Setup & Running

### Prerequisites
- Node.js 18+
- TypeScript 5+
- Express.js / ts-node
- IBM watsonx.ai account or OpenRouter key

### 1. Clone and Install
```bash
git clone https://github.com/Labreo/Football_Atlas.git
cd Football_Atlas
npm install
```

### 2. Configure Environment
Create a `.env` file inside the `backend/` directory:
```bash
cp backend/.env.example backend/.env
# Open backend/.env and populate your Watsonx or local test credentials:
# IBM_API_KEY=your-api-key
# IBM_PROJECT_ID=your-watsonx-project-id
# IBM_GRANITE_MODEL=ibm-granite/granite-4.1-8b
# IBM_BASE_URL=us-south.ml.cloud.ibm.com
```

### 3. Run the Monorepo
You can run the frontend, backend, or both concurrently from the root directory:
```bash
# Run both frontend and backend concurrently
npm run dev:all

# Run backend only
npm run dev:backend

# Run frontend only
npm run dev:frontend
```

### 4. Run Verification Suite
Verify the Watsonx configuration, MCP grounding, and tactical concepts ingestion:
```bash
# Verify Granite model setup and API connectivity
npx ts-node backend/src/verifyWatsonx.ts

# Verify and audit all 10 registered tactical concepts
npx ts-node backend/src/verify-all-concepts.ts

# Validate ground truth RAG chunks parsed by Docling
npx ts-node backend/src/verify-grounding.ts

# Test historical matches coordinates loader
npx ts-node backend/src/verify-historical.ts
```

---

## Project Structure

```
Football_Atlas/
├── backend/
│   ├── src/
│   │   ├── app.ts                 # Express app definition & middleware
│   │   ├── server.ts              # Server bootstrap (PORT 3001)
│   │   ├── verifyWatsonx.ts       # Watsonx connection diagnostic
│   │   ├── services/
│   │   │   ├── granite.service.ts # IBM Granite integration (watsonx SDK)
│   │   │   ├── contextForge.service.ts # MCP gateway coordinator
│   │   │   ├── docling.service.ts # Ingests & processes PDFs via Docling
│   │   │   └── statsbomb.service.ts # Ingests StatsBomb data & computes xT
│   │   ├── routes/
│   │   │   ├── granite.routes.ts  # Routes tutor questions to Granite
│   │   │   ├── match.routes.ts    # World Cup match coordinates endpoint
│   │   │   └── tactical.routes.ts # Tactical concepts routes
│   │   └── seed/                  # Seeding data for tactical playbook
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── index.css              # Custom neon dark styling (F1-inspired grid)
│   │   ├── pages/
│   │   │   └── Dashboard.tsx      # Main workspace layout (3D, Chat, HUD)
│   │   ├── components/
│   │   │   ├── pitch/             # Three.js 3D pitch rendering
│   │   │   ├── chat/              # AI Tutor interface
│   │   │   └── matches/           # World Cup stats, timelines, & lineups
│   │   └── tacticalEngine/        # Playback coordinate interpolators
│   ├── package.json
│   └── vite.config.ts
├── shared/
│   ├── src/
│   │   └── schemas/               # Zod validation models
│   └── package.json
└── README.md
```

---

## Judging Criteria Alignment

| Criterion | How we address it |
|-----------|-------------------|
| **Technical Execution** | Fully typed TypeScript monorepo; Three.js canvas rendering real coordinate ticks; R²-grounded xT and geometric xG models; strict Zod contract boundaries in `shared/` ensuring robust client-server interfaces. |
| **Innovation** | Counterfactual what-if options computed on the fly using a spatial expected threat surface; SVG Decision DNA diagrams; multilingual emotive analyst avatars changing expressions based on gameplay context. |
| **Challenge Fit** | Direct application of soccer analytics and coordinate data; addresses casual fans, tactical students, and amateur coaching/learning use cases. |
| **Feasibility** | Complete, working monorepo; ingests public StatsBomb datasets with zero local setup hurdles; scalable to any historical or live coordinate stream. |
| **Use of IBM Tech** | IBM Granite handles all conversational reasoning; every response is grounded in custom Context Forge MCP tools to prevent hallucination; IBM Docling processes unstructured tactical books into the grounding database. |

---

## Demo Scenarios

**Scenario 1: The 2022 World Cup Final Collapse (The 81st-Minute Equalizer)**
- Navigate to **Matches** (trophy icon in rail) ──► Select **Argentina vs France** from the dropdown ──► Click **Mbappé's Equaliser Shot** in the event list.
- Rotate and zoom the pitch, or click **Cinematic View** to observe the slow camera sweep of the reconstructed night stadium. Note the 15-meter vertical gap in Zone 14 highlighted by active passing corridors.

**Scenario 2: Counterfactual Tactical Queries**
- Open the **Classroom Chat** console on the right side of the dashboard.
- Ask the tutor: *"What would happen to the space in Zone 14 if Argentina dropped into a low block?"*
- Observe Granite call the MCP tools to query low block definitions, output a narrative detailing how vertical space would compress, and trigger a side-by-side pitch comparison of a low block vs. a high press.

**Scenario 3: Pep's 2009 False 9 Masterclass**
- Navigate to **Playbook** ──► Select **False 9** ──► Launch **Messi's False 9 vs. Real Madrid**.
- Watch Messi drop deep, dragging Cannavaro out of position. The screen overlays green movement arrows showing Henry and Eto'o running into the vacated central space.

---

## Team
Built for the IBM SkillsBuild AI Builders Challenge, June 2026.

Kanak Waradkar · BTech (Computer Engineering), Goa College Of Engineering · [GitHub](https://github.com/Labreo) · [LinkedIn](https://www.linkedin.com/in/kanak-waradkar-52a123304/)

---

## License

Licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE) for details.
