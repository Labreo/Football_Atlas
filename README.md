# Football Atlas

> **"Football Atlas turns 'why did that happen?' into something you can see."**

---

## The June Innovation Challenge: Soccer, AI, and the World Cup

Built for the **AI Builders Challenge sponsored by IBM SkillsBuild**, Football Atlas is a human-centered, explainable AI solution designed to help fans, players, and analysts understand soccer before, during, and after the match. 

By leveraging **IBM Granite**, **Context Forge (MCP)**, **IBM Docling**, and **IBM Bob**, the platform turns unstructured questions into real-time, coordinate-based 3D tactical playbacks—bridging the gap between surface-level broadcast narratives and deep spatial intelligence.

---

## The Problem

### Fandom is broad; spatial comprehension is narrow.

Over five billion people watch soccer, yet the overwhelming majority watch only the ball. During the World Cup, matches are defined not just by raw scores, but by interpretation, debate, and meaning:
*   *Why did momentum shift?*
*   *Why did a tactical change succeed or fail?*
*   *Why was a decision controversial, or correct?*

Currently, fans and amateur players trying to understand the game are left with static chalkboards, generic YouTube video loops, or speculative punditry. The rich spatial data and tactical analysis systems used by professional clubs are locked behind multi-million-dollar paywalls.

This divides the game. It reduces a highly strategic, spatial sport into simple player drama, locking the analytical vocabulary of soccer away from the global community.

> **Why this matters:** Without spatial literacy, fans miss the intellectual depth of the sport, and aspiring players cannot replicate tactical structures on the pitch.

---

## What Football Atlas Does

Football Atlas is an AI-powered interactive tactical learning platform. It translates unstructured, natural language questions into real-time, coordinate-based 3D animations.

You do not just read about a concept; you watch the virtual players execute it in 3D. You do not guess where a passing lane is; the field draws it dynamically.

```
+------------------+     Natural      +-------------------+     Tool Execution    +--------------------+
|  User Question   |   Language Query |  IBM Granite /    | ────────────────────> |   Context Forge    |
| ("Why is a False | ───────────────> | watsonx.ai Engine | <──────────────────── |   MCP Gateway      |
|  9 effective?")  |                  +---------┬---------+    Telemetry & Chunks +---------┬----------+
+------------------+                            │                                           │
                                                │ Narration                                 │ Coordinates
                                                ▼                                           ▼
                                      +-------------------+                       +--------------------+
                                      | Conversational UI |                       | Three.js 3D Pitch  |
                                      |    (Tutor Chat)   |                       | (Player Anim/Lines)|
                                      +-------------------+                       +--------------------+
```

The platform provides a **Conversational Classroom** where users ask questions, and a grounded AI Tutor powered by **IBM Granite** reasons over structured tactical data to generate explanations. Instantly, the 3D WebGL pitch animates the corresponding player movements, while an integrated **Docling**-parsed knowledge base grounds the analysis in canonical coaching literature and real-world historical examples.

> **Why this matters:** It turns static tactical theory into an active, reproducible visual language that bridges the gap between coaching manuals and live match observation.

---

## The Qatar 2022 World Cup Moment: The 81st-Minute Equaliser

Argentina led 2-0 in the 81st minute of the World Cup Final. In ninety-seven seconds, Kylian Mbappé scored twice, turning tactical dominance into sudden chaos. Most see only the final volley—an act of individual physics. **Football Atlas exposes the structural collapse that occurred three passes earlier.**

```
                      [ France Wins Ball ]  (Rabiot recovers possession in midfield)
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

1.  **The Recovery**: Rabiot wins the ball and immediately progresses it into the left channel to Mbappé.
2.  **The Pull**: Mbappé plays inside to Thuram. The vertical gap is now wide open.
3.  **The Distortion**: Central defender Romero is forced to step forward to challenge Thuram, leaving his zonal slot completely vacant.
4.  **The Release**: Thuram plays a one-touch wall pass back to Mbappé, who has sprinted into the vacated channel.
5.  **The Strike**: Mbappé volleys the ball into the corner before Otamendi can recover.

In Football Atlas, this is not just text. In `HeroMomentMode`, the pitch desaturates into an archival visual grid. The Three.js engine loads the exact coordinate trajectories of Rabiot, Mbappé, Thuram, Romero, and Molina. The timeline allows you to scrub through frame-by-frame, rendering the passing lanes and the expanding red highlight zone of the defensive collapse.

> **Why this matters:** It proves that goals are not random events of individual magic; they are the logical results of spatial failures.

---

## Why It Matters in the World Cup Context

World Cup matches are watched by billions of diverse fans. Football Atlas focuses on **Tactical Explainability**, **Trust & Transparency**, and **Fan & Learning Experiences**:
*   **Tactical Explainability**: Translates complex, abstract concepts (like *compactness* and *pressing lines*) into concrete 3D spatial simulations.
*   **Trust & Transparency**: Reconstructs controversial or critical decisions (like Romeros' step or vertical line disconnections) and grounds them with parsed primary documents (tactical books, technical reports).
*   **Fan & Learning Experiences**: Creates a personalized AI World Cup tutor with **Dual Audience Mode** to cater to both casual fans (emotion, star players) and tactical students (zonal spaces, passing lanes).

---

## AI & Technical Approach

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

---

## IBM Technologies Used

1.  **IBM Granite (via watsonx.ai)**: Serves as the primary reasoning engine, orchestrating MCP tool chains and narrating the dynamic lessons.
2.  **Context Forge (MCP Gateway)**: Acts as the Model Context Protocol (MCP) tool gateway, mediating safe, structured interactions between IBM Granite and internal data models while monitoring telemetry.
3.  **IBM Docling**: Runs the document ingestion pipeline. It parses unstructured PDF, MD, and DOCX tactical playbooks, extracting table data and headers to seed the grounded knowledge base.
4.  **IBM Bob (AI Code Assistant)**: Used throughout the development process to plan, write, and verify our TypeScript monorepo, and to dynamically generate 3D animation coordinate schemas and player trajectory modules—enabling the platform to scale and generate N number of custom match animations on the fly.

---

## Custom MCP Tools (Context Forge Integration)

Football Atlas isolates the IBM Granite LLM from direct data stores using the Model Context Protocol (MCP) powered by the **Context Forge** gateway.

As the central MCP Gateway, **Context Forge** orchestrates all tool execution, session management, and LLM communication. Rather than allowing the model to hallucinate numbers, match summaries, or coordinate maps, Granite is restricted to interacting with the application layer through a set of eight typed MCP tools registered on the Football Atlas MCP Server:

*   `get_concept_explanation`: Retrieves canonical definitions, key principles, and defensive counter-measures for a tactical concept, adapted to the user's knowledge level.
*   `trigger_animation`: Generates animation coordinate setups and visual overlay schemas for rendering on the 3D WebGL pitch.
*   `fetch_historical_example`: Searches and retrieves historical matches or performance examples matching specific concepts, players, or coaches.
*   `launch_breakdown`: Retrieves coordinate files, camera setups, and narrative timeline milestones for interactive match visualization.
*   `compose_concepts`: Generates comparative tactical relationship analyses connecting two different concepts (e.g. False 9 and Inverted Winger).
*   `assess_knowledge_level`: Analyzes user chat messages and history to calibrate tutor difficulty and response complexity.
*   `retrieve_source_evidence`: Extracts parsed evidence chunks and document excerpts grounded by IBM Docling.
*   `suggest_next_concept`: Generates recommendations for the next tactical concept to study based on prerequisites and mastery profiles.

> **Why this matters:** Restricting the LLM to a strict tool-calling contract orchestrated by Context Forge eliminates hallucinations and ensures that tactical explanations are verified against actual coaching datasets.

---

## The 10 Tactical Concepts Natively Supported

Football Atlas natively registers, defines, and simulates ten core tactical concepts:

1.  **False 9**: A center-forward drops into Zone 14 to draw center-backs out, creating midfield numerical overloads.
2.  **High Press**: A defensive line squeezing the opponent high up the pitch, using cover shadows to force deep turnovers.
3.  **Defensive Block**: A disciplined, compact out-of-possession shape (often 4-4-2) designed to deny central corridors and funnel attacks wide.
4.  **Pressing Trap**: Seemingly leaving a player open, then collapsing on them with multiple defenders the moment the pass is played.
5.  **Midfield Overload**: Pulling inverted full-backs or dropping forwards centrally to create passing diamonds and numeric advantages.
6.  **Counter-Attack Trigger**: Exploiting structural disorganization immediately after a turnover with direct, vertical outlet passes.
7.  **Inverted Winger**: A winger operating on their opposite foot who cuts inside into half-spaces to shoot or pass, opening wide channels for overlaps.
8.  **Back 3 Wing-Back System**: A dynamic shape morphing between a compact 5-back in defense and an expansive 3-2-5 in attack.
9.  **Third Man Run**: A three-player passing combination where Player A passes to B to draw defenders, while C sprints into space to receive a one-touch lay-off.
10. **Compactness and Pressing Lines**: Restricting the vertical and horizontal distance between defensive units to minimize space between the lines.

---

## Features

1.  **Interactive Tactical Pitch**: A WebGL-powered 3D field rendering player movements, ball trajectories, and tactical annotations.
2.  **Conversational Classroom**: An interactive console enabling natural language dialogue with the Granite-powered AI Tutor.
3.  **Historical Match Breakdowns**: Interactive timeline reviews of legendary matches (e.g., Barcelona 2009, Argentina vs. France 2022).
4.  **Concept Chaining**: Directed graph navigation showing how simple tactical concepts combine into complex systems.
5.  **Dual Audience Mode**: Real-time linguistic routing adapting response text between casual narrative and tactical analysis.
6.  **Audio Commentary Mode**: Text-to-speech commentary narrating simulated events in real time.
7.  **Adaptive Knowledge-Level Detection**: Calibrating response detail and recommendation difficulty based on learner history.
8.  **Historical Mode**: A specialized "archival scanline" visual style for rendering retro or classic football matches.
9.  **Tactical Playbook**: A library of canonical tactical concepts containing definitions, triggers, and counter-strategies.
10. **Real-Time Concept Visualization**: Dynamic overlays (pressing heatmaps, passing lanes, space heatmaps) rendering on-the-fly.

---

## Local Development & Deployment

Football Atlas is built for cloud scaling and quick local iteration:
*   **Frontend**: Hosted as a static React build on Vercel.
*   **Backend**: Hosted as a Docker container on Render / Railway / IBM Cloud.

### Environment Configuration

Ensure the following variables are configured:

| Variable | Scope | Purpose |
| :--- | :--- | :--- |
| `IBM_API_KEY` | Backend | IBM Cloud IAM API Key or OpenRouter Key. |
| `IBM_PROJECT_ID` | Backend | Watsonx Project ID (`openrouter-mode` for local dev). |
| `IBM_GRANITE_MODEL` | Backend | Model identifier (e.g. `ibm-granite/granite-4.1-8b`). |
| `IBM_BASE_URL` | Backend | Watsonx regional ML endpoint host or OpenRouter API URL. |
| `MCP_SERVER_URL`| Backend | Base URL of the running Context Forge MCP Gateway. |
| `VITE_API_BASE_URL`| Frontend| Full backend base URL (e.g., `https://api.footballatlas.com`). |

---

## Demo Scenarios for Judges

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

---

## Judging Criteria Alignment

| Criteria | Platform Alignment | Proof Point |
| :--- | :--- | :--- |
| **Technical Execution** | Full-stack monorepo featuring strict schemas, typed tool gateways, and performant 3D WebGL rendering. | Type-safe JSON schemas in `shared/`, custom Three.js mesh calculations in `frontend/src/tacticalPrimitives`. |
| **Innovation** | Moving beyond static video feeds and raw LLM text. Football Atlas links text, documents, and 3D visual coordinates together. | The Context Forge MCP Gateway translates LLM intent into canvas-level overlay drawings on the fly. |
| **Feasibility & Readiness**| Operational dev and production builds with full verification suites, Docker configurations, and clear deployment scripts. | Green builds on both backend and frontend, verifiable Watsonx diagnostic scripts (`verifyWatsonx.ts`). |
| **Educational Value** | Calibrated learning paths and real-time comprehension telemetry proving actual knowledge transfer. | Dynamic `AudienceDetectionEngine` and interactive concept graphs showing prerequisite paths. |

---

## Team

Built for the IBM SkillsBuild AI Builders Challenge, May 2026.

Kanak Waradkar · BTech (Computer Engineering), Goa College Of Engineering · [GitHub](https://github.com/Labreo) · [LinkedIn](https://www.linkedin.com/in/kanak-waradkar-52a123304/)

---

## License

Licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE) for details.
