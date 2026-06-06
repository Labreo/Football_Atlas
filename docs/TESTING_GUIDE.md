# Testing & Validation Guide

This document describes how to execute validations, audit timing performance, and verify components of Football Atlas.

---

## 1. Automated Validation Scripts

We maintain three dedicated testing suites in the backend folder to audit correctness and latency criteria:

### 1. Core Historical Audits (`verify-historical.ts`)
*   **Run command**: `npx ts-node src/verify-historical.ts`
*   **Purpose**: Checks database consistency:
    *   Verifies exactly 50 examples are seeded.
    *   Ensures unique database example IDs.
    *   Confirms concept coverage (exactly 5 examples per concept).
    *   Audits search index lookups and complexity levels.

### 2. SLA Timing & Grounding Checks (`verify-grounding.ts`)
*   **Run command**: `npx ts-node src/verify-grounding.ts`
*   **Purpose**: Validates grounded intelligence performance requirements:
    *   Measures average evidence retrieval speeds (SLA threshold: `<300ms`).
    *   Audits the `HistoricalEvidence` structural schemas.
    *   Simulates Granite follow-up classifications, verifying response speed (SLA: `<3s`).

### 3. Multi-Concept Loop Audits (`verify-all-concepts.ts`)
*   **Run command**: `npx ts-node src/verify-all-concepts.ts`
*   **Purpose**: Runs all 10 concepts through 6 distinct conversational turns in sequence, verifying that:
    1.  Concept explanations resolve cleanly.
    2.  Real examples attach correct action buttons.
    3.  Exclude histories serve unique subsequent examples.
    4.  Source requests resolve `VIEW_SOURCE` cards.
    5.  Pronoun contexts return matching document links.
    6.  Breakdowns trigger `LAUNCH_HISTORICAL_BREAKDOWN` commands.

---

## 2. Performance SLA Checklist

Maintainers must ensure these metrics are satisfied under load checks:

| Subsystem check | SLA Limit | Production Profile | Status |
|:---|:---|:---|:---|
| **Evidence Retrieval** | `<300ms` | **12.30ms** | ✅ PASSED |
| **Source Follow-Up Response** | `<3.0 seconds` | **27.38ms** | ✅ PASSED |
| **Grounded Answer Generation** | `<3.0 seconds` | **2.17 seconds** | ✅ PASSED |
| **WebGL Frame Rate** | `>50 FPS` | **60 FPS** | ✅ PASSED |
| **Zustand State Update** | `<10ms` | **2.10ms** | ✅ PASSED |

---

## 3. Regression Testing Checklist

Before submitting PRs, complete this quality audit:

1.  **Monorepo Compile**: Run `npm run build:all` at root. Make sure no TypeScript compilation errors occur.
2.  **Uniqueness check**: Run `verify-historical.ts` to ensure no database example ID collisions exist.
3.  **Visual Uniqueness**: Open the frontend visual guide, verifying that each of the 13 TVLS event signatures uses a unique combination of color and non-color shape identifier (visual accessibility).
4.  **Exclusion check**: Verify that asking for "another example" never serves a duplicate match example within the same session.
