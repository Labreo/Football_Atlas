# Football Atlas

# Hero Statement

> "Football Atlas turns 'why did that happen?' into something you can see."

---

# The Problem

Fandom is broad; spatial comprehension is narrow.

Over five billion people watch football, yet the overwhelming majority watch only the ball. Broadcasters supply highlights, emotional narratives, and post-match banter. Professional clubs use proprietary, multi-million-dollar positional tracking software to dissect space, passing lanes, and pressing triggers.

The space between is empty. The curious fan asks, *"Why did that defender step up?"* The player asks, *"How do I recognize a pressing trap?"* Currently, their options are static chalkboards, generic YouTube video loops, or speculative punditry.

This divides the game. It locks the analytical vocabulary of football behind paywalls and professional walls, reducing a highly strategic, spatial sport into simple player drama.

*Why this matters: Without spatial literacy, viewers miss the intellectual depth of the sport, and players cannot replicate tactical structures on the pitch.*

---

# What Football Atlas Does

Football Atlas is an AI-powered interactive tactical learning platform. It translates unstructured, natural language questions into real-time, coordinate-based 3D animations.

You do not read about a concept; you watch the entities execute it. You do not guess where a passing lane is; the field draws it under the ball.

The platform provides a Conversational Classroom where users ask questions, and a grounded AI Tutor powered by IBM Granite reasons over structured tactical data to generate explanations. Instantly, the 3D WebGL pitch animates the corresponding player movements, while an integrated Docling-parsed knowledge base grounds the analysis in canonical coaching literature and real-world historical examples.

*Why this matters: It turns static tactical theory into an active, reproducible visual language that bridges the gap between coaching manual theory and real-time observation.*

---

# The Qatar 2025 Moment Equivalent

Argentina led 2-0 in the 81st minute of the World Cup Final. In ninety-seven seconds, Kylian Mbappé scored twice, turning tactical dominance into sudden chaos. 

Most see the final volley—an act of individual physics. Football Atlas exposes the structural collapse that occurred three passes earlier.

```
                      [ France Wins Ball ]  (Rabiot recovers possession)
                              │
                              ▼
                      [ Progress to Wing ]  (Pass to Mbappé wide; midfield fails to drop)
                              │
                              ▼
                      [ Midfield Disconnection ]  (Pass to Thuram; vertical gap opens in Zone 14)
                              │
                              ▼
                      [ Space Exploitation ]  (First-time wall pass return to Mbappé; Romero drawn out)
                              │
                              ▼
                      [ Mbappé Volley Equaliser ]  (France scores in three passes)
```

The trigger was not Mbappé’s speed, but fatigue-induced separation. In the 80th minute, Argentina’s midfield line failed to drop with their backline, leaving a vertical gap in Zone 14.

1. **The Recovery**: Rabiot wins the ball and immediately progresses it into the left channel to Mbappé.
2. **The Pull**: Mbappé plays inside to Thuram. The vertical gap is now wide open.
3. **The Distortion**: Central defender Romero is forced to step forward to challenge Thuram, leaving his zonal slot completely vacant.
4. **The Release**: Thuram plays a one-touch wall pass back to Mbappé, who has sprinted into the vacated channel.
5. **The Strike**: Mbappé volleys the ball into the corner before Otamendi can recover.

In Football Atlas, this is not just text. In `HeroMomentMode`, the pitch desaturates into an archival visual grid. The Three.js engine loads the exact coordinate trajectories of Rabiot, Mbappé, Thuram, Romero, and Molina. The timeline allows you to scrub through frame-by-frame, rendering the passing lanes and the expanding red highlight zone of the defensive collapse.

*Why this matters: It proves that goals are not random events of individual magic; they are the logical results of spatial failures.*

---

# Why It Matters

Coaching tools are built for the elite. Fandom is built for the masses. Football Atlas democratizes spatial intelligence.

By turning natural language queries into interactive coordinate-based animations, we eliminate the steep learning curve of tactical analysis. Analysts get a tool to explain decisions to players, fans get to understand the underlying mechanics of their favorite teams, and players learn how to visually spot tactical triggers. 

Tactics are not just lines on a board; they are the grammar of the game. Making them visible changes how the game is learned and appreciated.

*Why this matters: Visualizing space forces the viewer to move from passive entertainment to analytical comprehension.*

---

# The 10 Tactical Concepts

Football Atlas natively registers, defines, and simulates ten core tactical concepts:

1. **False 9**: A center-forward drops into Zone 14 to draw center-backs out, creating midfield numerical overloads.
2. **High Press**: A defensive line squeezing the opponent high up the pitch, using cover shadows to force deep turnovers.
3. **Defensive Block**: A disciplined, compact out-of-possession shape (often 4-4-2) designed to deny central corridors and funnel attacks wide.
4. **Pressing Trap**: Seemingly leaving a player open, then collapsing on them with multiple defenders the moment the pass is played.
5. **Midfield Overload**: Pulling inverted full-backs or dropping forwards centrally to create passing diamonds and numeric advantages (e.g. 4v3).
6. **Counter-Attack Trigger**: Exploiting structural disorganization immediately after a turnover with direct, vertical outlet passes.
7. **Inverted Winger**: A winger operating on their opposite foot who cuts inside into half-spaces to shoot or pass, opening wide channels for overlaps.
8. **Back 3 Wing-Back System**: A dynamic shape morphing between a compact 5-back in defense and an expansive 3-2-5 in attack.
9. **Third Man Run**: A three-player passing combination where Player A passes to B to draw defenders, while C sprints into space to receive a one-touch lay-off.
10. **Compactness and Pressing Lines**: Restricting the vertical and horizontal distance between defensive units to minimize space between the lines.

*Why this matters: These concepts form the structural vocabulary of modern football. Standardizing their definitions and animation schemas guarantees that players and fans learn the game using the same professional terminology.*

---

# Technical Architecture

Football Atlas is structured as a TypeScript monorepo with strict package boundaries:

*   **Shared Contract ([shared/](file:///Users/sanjaywaradkar/Football_Atlas/shared/))**: Handles Zod schema definitions, types, and the concept seed registry, ensuring type-safe client-server contracts.
*   **Express Backend ([backend/](file:///Users/sanjaywaradkar/Football_Atlas/backend/))**: Manages the tactical repositories, RAG pipelines (IBM Docling), and local JSON stores.
*   **React Frontend ([frontend/](file:///Users/sanjaywaradkar/Football_Atlas/frontend/))**: Employs Three.js for 3D pitch rendering and Zustand for real-time state management.

```
+---------------------------------------------------------------------------------+
|                                 REACT CLIENT                                    |
|                                                                                 |
|   +-----------------------+   +------------------------+   +----------------+   |
|   |  3D Three.js Pitch    |   |  Conversational Tutor  |   |   Impact HUD   |   |
|   |  (WebGL / Primitives) |   |  (Chat UI & Telemetry) |   |  (Dashboard)   |   |
|   +-----------+-----------+   +-----------+------------+   +--------+-------+   |
+---------------|---------------------------|-------------------------|-----------+
                |                           |                         |
                | Three.js Positional Ticks | REST API HTTP Request   | Metrics
                v                           v                         v
+---------------------------------------------------------------------------------+
|                                EXPRESS BACKEND                                  |
|                                                                                 |
|   +-----------------------+   +------------------------+   +----------------+   |
|   |  Orchestrator Router  |   |   Context Forge MCP    |   | Ingestion Hub  |   |
|   |  (API Routing & Zod)  |   |   (Granite Tool Gate)  |   | (Docling RAG)  |   |
|   +-----------+-----------+   +-----------+------------+   +--------+-------+   |
+---------------|---------------------------|-------------------------|-----------+
                |                           |                         |
                v Read / Write              v Tool Call Execution     v Parsing
      +-------------------+       +--------------------+    +------------------+
      |  Local JSON DBs   |       | IBM Granite Model  |    | Tactical PDFs    |
      |  (learner_store)  |       | (watsonx.ai API)   |    | (Concept Chunks) |
      +-------------------+       +--------------------+    +------------------+
```

*Why this matters: Loose coupling and strict contracts ensure that the heavy 3D rendering pipeline remains responsive, unaffected by network latency or AI inference delay.*

---

# AI Architecture

Football Atlas isolates the IBM Granite LLM from direct data stores using the Model Context Protocol (MCP) powered by the **Context Forge** gateway.

As the central MCP Gateway, **Context Forge** orchestrates all tool execution, session management, and LLM communication. Rather than allowing the model to hallucinate numbers, match summaries, or coordinate maps, Granite is restricted to interacting with the application layer through a set of eight typed MCP tools registered on the Football Atlas MCP Server. When a user asks a tactical question, Context Forge manages the turn: it invokes the knowledge level analyzer, maps the user's intent to a sequence of tool calls, executes them locally against the structured repositories, and feeds the compiled telemetry and Docling-parsed evidence to Granite to synthesize a grounded educational response.

### Custom MCP Tools

*   `get_concept_explanation`: Retrieves canonical definitions, key principles, and defensive counter-measures for a tactical concept, adapted to the user's knowledge level.
*   `trigger_animation`: Generates animation coordinate setups and visual overlay schemas for rendering on the 3D WebGL pitch.
*   `fetch_historical_example`: Searches and retrieves historical matches or performance examples matching specific concepts, players, or coaches.
*   `launch_breakdown`: Retrieves coordinate files, camera setups, and narrative timeline milestones for interactive match visualization.
*   `compose_concepts`: Generates comparative tactical relationship analyses connecting two different concepts (e.g. False 9 and Inverted Winger).
*   `assess_knowledge_level`: Analyzes user chat messages and history to calibrate tutor difficulty and response complexity.
*   `retrieve_source_evidence`: Extracts parsed evidence chunks and document excerpts grounded by IBM Docling.
*   `suggest_next_concept`: Generates recommendations for the next tactical concept to study based on prerequisites and mastery profiles.

*Why this matters: Restricting the LLM to a strict tool-calling contract orchestrated by Context Forge eliminates hallucinations and ensures that tactical explanations are verified against actual coaching datasets.*

---

# Historical Breakdown System

Tactical breakdowns are interactive 3D simulations synced with narrative milestones rather than flat, static video streams. 

When a user initiates a breakdown:
1.  **Coordinate Mapping**: The backend loads coordinate files containing player and ball positioning matrices.
2.  **3D Playback Engine**: The Three.js engine renders entities on the pitch, updating position variables inside a 60fps tick loop.
3.  **Camera Controls**: The camera slides dynamically across preset angles (`overview`, `player_focus`, `tactical_shape`, `passing_lane`) to best display the spatial actions.
4.  **Evidence Grounding**: A slide-out panel displays parsed text excerpts extracted by IBM Docling from verified coaching manuals.

*Why this matters: It connects abstract concepts (like "compactness") to real, historical proof (like the 2022 World Cup Final), enabling analytical double-checking of every tactical claim.*

---

# Dual Audience Mode

Football Atlas communicates with casual fans and tactical students differently. The same 3D coordinates can trigger two entirely distinct explanations.

The `AudienceDetectionEngine` monitors user input register and automatically toggles the presentation mode based on vocabulary density:

| Feature | 🏟 Fan View | 📐 Tactical View |
| :--- | :--- | :--- |
| **Focus** | Narrative, emotion, star players, drama. | Spatial control, defensive transitions, compactness. |
| **Tone** | *"Mbappé volleyed a dramatic equaliser."* | *"Mbappé exploited the 15-meter vertical gap in Zone 14."* |
| **Visuals** | Highlighted player runs and goals. | Passing lanes, pressing zones, and defensive line margins. |

*Why this matters: It meets the user at their level of expertise. Casual fans are not alienated by jargon, and serious students are not bored by surface-level highlights.*

---

# IBM Technologies Used

*   **IBM Granite (via watsonx.ai / OpenRouter)**: Serves as the primary reasoning engine, orchestrating MCP tool chains and narrating the dynamic lessons.
*   **IBM Docling**: Runs the document ingestion pipeline. It parses unstructured PDF, MD, and DOCX tactical playbooks, extracting table data and headers to seed the grounded knowledge base.
*   **Context Forge (MCP Gateway)**: Acts as the Model Context Protocol (MCP) tool gateway, mediating safe, structured interactions between IBM Granite and internal data models while monitoring telemetry.

*Why this matters: Integrating enterprise-grade document extraction (Docling) and reasoning models (Granite) with a standardized MCP gateway (Context Forge) guarantees a secure, zero-hallucination RAG pipeline.*

---

# Features

1.  **Interactive Tactical Pitch**: A WebGL-powered 3D field rendering player movements, ball trajectories, and tactical annotations.
2.  **Conversational Classroom**: An interactive console enabling natural language dialogue with the Granite-powered AI Tutor.
3.  **Historical Match Breakdowns**: Interactive timeline reviews of legendary football matches (e.g. Barcelona 2009, Argentina vs France 2022).
4.  **Concept Chaining**: Directed graph navigation showing how simple tactical concepts combine into complex systems.
5.  **Dual Audience Mode**: Real-time linguistic routing adapting response text between casual narrative and tactical analysis.
6.  **Audio Commentary Mode**: Text-to-speech commentary narrating simulated events in real time.
7.  **Adaptive Knowledge-Level Detection**: Calibrating response detail and recommendation difficulty based on learner history.
8.  **Historical Mode**: A specialized "archival scanline" visual style for rendering retro or classic football matches.
9.  **Tactical Playbook**: A library of canonical tactical concepts containing definitions, triggers, and counter-strategies.
10. **Real-Time Concept Visualization**: Dynamic overlays (pressing heatmaps, passing lanes, space heatmaps) rendering on-the-fly.

*Why this matters: This rich feature set ensures multiple entry points for learning, satisfying visual, auditory, and conversational learners.*

---

# Deployment

Football Atlas is built for cloud scaling and quick local iteration:

*   **Frontend**: Hosted as a static React build on Vercel.
*   **Backend**: Hosted as a Docker container on Render / Railway / IBM Cloud.

### Environment Configuration

Ensure the following variables are configured in the production environment:

| Variable | Scope | Purpose |
| :--- | :--- | :--- |
| `IBM_API_KEY` | Backend | IBM Cloud IAM API Key or OpenRouter Key. |
| `IBM_PROJECT_ID` | Backend | Watsonx Project ID (`openrouter-mode` for local dev). |
| `IBM_GRANITE_MODEL` | Backend | Model identifier (e.g. `ibm-granite/granite-4.1-8b`). |
| `IBM_BASE_URL` | Backend | Watsonx regional ML endpoint host or OpenRouter API URL. |
| `MCP_SERVER_URL`| Backend | Base URL of the running Context Forge MCP Gateway. |
| `VITE_API_BASE_URL`| Frontend| Full backend base URL (e.g., `https://api.footballatlas.com`). |

*Why this matters: Clean separation of configuration and code allows seamless switching between local open-source testing (via OpenRouter) and production enterprise deployments (via watsonx.ai).*

---

# Demo Scenarios

### Scenario 1: The 2022 World Cup Final Collapse
*   **Path**: Navigate to **Explore** ──> Select **Compactness and Pressing Lines** ──> Launch **Mbappé Equaliser Sequence**.
*   **Action**: Use the timeline slider to pause at **Phase 3 (Central Delivery)**.
*   **Observation**: Rotate the pitch to view how Argentina's midfield is vertically separated from the backline. Inspect the **Evidence Panel** to read the Docling-parsed excerpt explaining Zone 14 space exploitation.

### Scenario 2: Counterfactual Tactical Queries
*   **Path**: Open the **Classroom Chat**.
*   **Query**: Ask the tutor: *"What would happen to the space in Zone 14 if Argentina dropped into a low block?"*
*   **Observation**: Granite calls the MCP tools to query low block definitions, returns a text analysis of how vertical space would compress, and triggers a side-by-side pitch comparison of a low block vs. a high press.

### Scenario 3: Pep's 2009 False 9 Masterclass
*   **Path**: Navigate to **Playbook** ──> Select **False 9** ──> Launch **Messi's False 9 vs. Real Madrid**.
*   **Observation**: Watch Messi drop deep, dragging Cannavaro out of position. The screen overlays green movement arrows showing Henry and Eto'o running into the vacated central space.

*Why this matters: Providing explicit scenarios allows hackathon judges to verify the visual and logical depth of the platform in under three minutes.*

---

# Judging Criteria Alignment

| Criteria | Platform Alignment | Proof Point |
| :--- | :--- | :--- |
| **Technical Execution** | Full-stack monorepo featuring strict schemas, typed tool gateways, and performant 3D WebGL rendering. | Type-safe JSON schemas in `shared/`, custom Three.js mesh calculations in `frontend/src/tacticalPrimitives`. |
| **Innovation** | Moving beyond static video feeds and raw LLM text. Football Atlas links text, documents, and 3D visual coordinates together. | The Context Forge MCP Gateway translates LLM intent into canvas-level overlay drawings on the fly. |
| **Feasibility & Readiness**| Operational dev and production builds with full verification suites, Docker configurations, and clear deployment scripts. | Green builds on both backend and frontend, verifiable Watsonx diagnostic scripts (`verifyWatsonx.ts`). |
| **Educational Value** | Calibrated learning paths and real-time comprehension telemetry proving actual knowledge transfer. | Dynamic `AudienceDetectionEngine` and interactive concept graphs showing prerequisite paths. |

*Why this matters: It shows the judges that Football Atlas wasn't just built for fun—it was engineered to win.*

---

# Team

Built for the IBM SkillsBuild AI Builders Challenge, May 2026.

Kanak Waradkar · BTech (Computer Engineering), Goa College Of Engineering · [GitHub](https://github.com/Labreo) · [LinkedIn](https://www.linkedin.com/in/kanak-waradkar-52a123304/)

---

# License

Licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE) for details.

*Why this matters: Clean licensing ensures the codebase can be studied, adapted, and integrated by other educational teams.*
