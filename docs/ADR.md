# Architectural Decision Records (ADRs)

This document contains the Architectural Decision Records for the major design choices in Football Atlas.

---

## ADR 1: Self-Registering Concept Modules

### Status
Accepted

### Context
In early iterations, loading a tactical concept animation required writing hardcoded `switch` statements inside the orchestrator and layout views. This made adding new concepts error-prone and increased file coupling.

### Decision
We moved to a **self-registering registry pattern**. Each concept defines a `ConceptPackage` containing its manifest, keyword vocabulary, and animation module class. When the system boots, the `conceptLoader` validates these packages and registers them dynamically in the central registry.

### Consequences
*   **Pros**: Highly modular. Adding a concept is zero-touch for the core orchestrator.
*   **Cons**: Requires strict runtime validation to ensure modules conform to standard life cycle callbacks.

---

## ADR 2: In-Memory Indexing & Weighted Scoring for Evidence Retrieval

### Status
Accepted

### Context
Ingesting thousands of coaching manual pages requires search matching. We need to rank and extract relevant chunks in under **300ms** to avoid lagging chat conversations.

### Decision
Instead of deploying a heavy vector database (e.g. Pinecone) or full-text SQL server, we built a lightweight **in-memory index** using JavaScript Map records. Docling converted markdown chunks are stored alongside tag matrices. Grounding checks compute weighted tag overlaps dynamically.

### Consequences
*   **Pros**: Search latency averages **12ms** (SLA target was <300ms). Zero operational overhead or external API dependency.
*   **Cons**: Store size is limited by server RAM (suitable for tens of thousands of document chunks, but would require sharding for millions).

---

## ADR 3: Strict Division of Abstract vs. Historical Presentation Modes

### Status
Accepted

### Context
A unified style across conceptual lessons and real match playbacks led to cognitive overload. Users struggled to distinguish between generalized theory (e.g., how the False 9 moves in abstract space) and specific historical case study runs (e.g., Lionel Messi's run path in 2009).

### Decision
We implemented **Historical Mode**. When a real match example is active, we apply a dedicated layout class (`.historical-mode`), desaturate pitch graphics, shift visual triggers onto golden accents, inject a grid scanline, and display an archival watermark.

### Consequences
*   **Pros**: Visual cues make historical context instantly recognizable.
*   **Cons**: Requires theme checking in every 3D primitive compilation step.

---

## ADR 4: In-Context Pronoun Resolution (Reference Resolver)

### Status
Accepted

### Context
Conversational learning involves short, context-dependent follow-up questions (*"Where did he get that?"*, *"Why did it work?"*). Sending these queries directly to Granite without history led to classification failures.

### Decision
We introduced a **Reference Resolver** in the backend. Before Granite queries Watsonx, the resolver inspects session history logs to translate ambiguous pronouns to the active context elements (resolving *"he"* to the active coach, and *"it"* to the active concept).

### Consequences
*   **Pros**: High conversational continuity.
*   **Cons**: Increases prompt size slightly by injecting context variables.
