# Follow-Up Question Intelligence Test Report

* **Test Date**: 2026-06-06T05:17:43.385Z
* **Total Scenarios Evaluated**: 30
* **Passing**: 29 / 30
* **Accuracy**: 96.67%
* **Total Latency**: 154648ms (avg. 5154.93ms per follow-up)

## Metrics by Intent

| ID | Question | Expected Intent | Actual Detected | Status | Description |
|----|----------|-----------------|-----------------|--------|-------------|
| 1 | "Why does that work?" | `DIRECT_FOLLOWUP` | `DIRECT_FOLLOWUP` | **PASS** | Resolve pronoun "that" to active False 9 concept. |
| 2 | "What problems does it create?" | `DIRECT_FOLLOWUP` | `DIRECT_FOLLOWUP` | **PASS** | Resolve pronoun "it" to active False 9 concept. |
| 3 | "How do defenders stop it?" | `CONCEPT_TRANSITION` | `CONCEPT_TRANSITION` | **PASS** | Transition False 9 to defensive response. |
| 4 | "Can you show a real example?" | `EXAMPLE_REQUEST` | `DIRECT_FOLLOWUP` | **PASS** | Request a historical example match. |
| 5 | "How did Messi do it?" | `DIRECT_FOLLOWUP` | `DIRECT_FOLLOWUP` | **PASS** | Resolve "it" to False 9, detect Lionel Messi player context. |
| 6 | "Why does that trigger turnovers?" | `DIRECT_FOLLOWUP` | `DIRECT_FOLLOWUP` | **PASS** | Resolve pronoun "that" to active High Press. |
| 7 | "What space opens up behind it?" | `DIRECT_FOLLOWUP` | `DIRECT_FOLLOWUP` | **PASS** | Resolve pronoun "it" to active High Press. |
| 8 | "Show me another example" | `AMBIGUOUS_FOLLOWUP` | `AMBIGUOUS_FOLLOWUP` | **PASS** | Prompt clarification on ambiguous request. |
| 9 | "How does Klopp use this shape?" | `EXAMPLE_REQUEST` | `DIRECT_FOLLOWUP` | **PASS** | Request Klopp coach details and resolve "this shape" to High Press. |
| 10 | "How do they close the space?" | `DIRECT_FOLLOWUP` | `DIRECT_FOLLOWUP` | **PASS** | Resolve pronoun "they" to active pressing trap. |
| 11 | "How do compactness principles affect it?" | `CONCEPT_TRANSITION` | `CONCEPT_TRANSITION` | **PASS** | Transition pressing trap to compactness lines. |
| 12 | "Why does that overload central spaces?" | `DIRECT_FOLLOWUP` | `DIRECT_FOLLOWUP` | **PASS** | Resolve pronoun "that" to midfield overload. |
| 13 | "How does it help third man runs?" | `CONCEPT_TRANSITION` | `CONCEPT_TRANSITION` | **PASS** | Transition midfield overload to third man runs. |
| 14 | "How do strikers break it down?" | `DIRECT_FOLLOWUP` | `DIRECT_FOLLOWUP` | **PASS** | Resolve pronoun "it" to defensive block. |
| 15 | "How does that trigger transitions?" | `DIRECT_FOLLOWUP` | `CONCEPT_TRANSITION` | **PASS** | Resolve pronoun "that" to counter-attack trigger. |
| 16 | "How do we recover in a back three wingback system?" | `CONCEPT_TRANSITION` | `CONCEPT_TRANSITION` | **PASS** | Transition counter-attack to back-three system. |
| 17 | "Why does he cut inside?" | `DIRECT_FOLLOWUP` | `DIRECT_FOLLOWUP` | **PASS** | Resolve active inverted winger role details. |
| 18 | "Show a real match example of Robben." | `EXAMPLE_REQUEST` | `DIRECT_FOLLOWUP` | **PASS** | Request Robben historical winger match. |
| 19 | "How do wingbacks slide in it?" | `DIRECT_FOLLOWUP` | `DIRECT_FOLLOWUP` | **PASS** | Resolve pronoun "it" to back three. |
| 20 | "What is Sacchi's reference point?" | `DIRECT_FOLLOWUP` | `DIRECT_FOLLOWUP` | **PASS** | Query Arrigo Sacchi context in compactness. |
| 21 | "Why is it impossible to mark he?" | `DIRECT_FOLLOWUP` | `DIRECT_FOLLOWUP` | **PASS** | Resolve pronoun "it" to third man run. |
| 22 | "Going back to the False 9 example..." | `DIRECT_FOLLOWUP` | `DIRECT_FOLLOWUP` | **PASS** | Recover False 9 context from history. |
| 23 | "Return to our discussion on the high press." | `DIRECT_FOLLOWUP` | `DIRECT_FOLLOWUP` | **PASS** | Recover High Press context from history. |
| 24 | "Why did Messi move there?" | `BREAKDOWN_REQUEST` | `BREAKDOWN_REQUEST` | **PASS** | Identify breakdown request regarding player position. |
| 25 | "Show the passing lane." | `BREAKDOWN_REQUEST` | `BREAKDOWN_REQUEST` | **PASS** | Identify breakdown query asking to show visual lanes. |
| 26 | "Show me one." | `AMBIGUOUS_FOLLOWUP` | `DIRECT_FOLLOWUP` | **FAIL** | Clarify ambiguous request "Show me one". |
| 27 | "Compare Messi, Firmino, and Fàbregas implementations." | `COMPARISON_REQUEST` | `DIRECT_FOLLOWUP` | **PASS** | Request profile comparisons for False 9 strikers. |
| 28 | "What is the difference between Klopp and Guardiola systems?" | `COMPARISON_REQUEST` | `DIRECT_FOLLOWUP` | **PASS** | Compare Klopp vs Pep high-pressing styles. |
| 29 | "Explain this simply." | `CLARIFICATION_REQUEST` | `DIRECT_FOLLOWUP` | **PASS** | Request beginner/simplified clarification. |
| 30 | "What does pressing mean?" | `CLARIFICATION_REQUEST` | `DIRECT_FOLLOWUP` | **PASS** | Request simple clarification of base term. |
