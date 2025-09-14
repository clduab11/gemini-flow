# PR Plan: TypeScript Stabilization (Top 10 Error Groups)

This plan enumerates the highest‑impact TypeScript error groups and the proposed fixes to reach a green `tsc --noEmit` build.

1) Agentspace API Drift (AgentSpaceInitializer.ts)
- Errors: missing exports, wrong method signatures (`on`, `deployAgent`, `createCollaborativeWorkspace`, argument counts)
- Plan: open `src/agentspace/core/*` to align exported types and method names with initializer usage; add shims where needed.
- Deliverables: Type-safe `AgentSpaceManager` public API + updated initializer usage.

2) Unknown error type usage
- Files: many (`agentspace/*`, `testing/*`)
- Plan: enforce `catch (error: unknown)` and normalize with helper `getErrorMessage(error: unknown): string`.
- Deliverables: shared util + refactors across modules.

3) Streaming types collision & missing declarations
- Errors: duplicate identifiers, missing names in `src/streaming/index.ts`, shape mismatches in quality engines.
- Plan: centralize streaming types under `src/types/streaming.ts`; alias local impl types to avoid collisions; adjust default configs to `as const` or proper shapes.
- Deliverables: consistent `StreamingContext`, `EnhancedStreamingConfig`; remove duplicates.

4) Quality adaptation engine type safety
- Errors: union key indexing (e.g., `'auto'` not in thresholds), assigning objects to string fields.
- Plan: fix discriminated unions and strong typings for thresholds; replace placeholder strings with structured types.
- Deliverables: typed thresholds, actions, conditions; remove improper assignments.

5) Unified API config mismatches
- Errors: config object shapes vs strict interfaces.
- Plan: either relax config types with partials + runtime validation, or fully match the interface; remove dual imported type collisions (done in this PR for duplicates).
- Deliverables: validated config builder helpers + narrow public types.

6) Research coordinator access control
- Errors: private method access (`validateAccess`).
- Plan: provide public wrapper (done) and migrate callers (done). Review remaining call sites.
- Deliverables: SecurityAccess facade + codemod for consumers.

7) Dynamic adapter loader async/await & error typing
- Errors: `await` in non‑async fn; unknown errors; ESM `require`.
- Plan: use `createRequire`, sync fs reads (done), proper error formatting (done).
- Deliverables: stable dependency checks without top‑level await (done).

8) Types bleeding from tests
- Errors: jest globals/type collisions when compiling app code.
- Plan: exclude `tests/**` in `tsconfig.json` (done); keep test typing within Jest runtime only.
- Deliverables: green app typecheck independent of tests (partial; more fixes still needed).

9) Logger typing hygiene
- Errors: implicit `any` destructures in `Logger`.
- Plan: add proper types to logger sinks and event payloads.
- Deliverables: typed logger methods + minimal interfaces.

10) Workspace Google integration generics
- Errors: string passed to `never` due to overly constrained generics.
- Plan: add generic defaults + widen types for collections/keys; remove `never[]` inference by explicit annotation.
- Deliverables: compile‑safe interfaces for integration collections.

Milestones
- M1: Fix Agentspace + Streaming type collisions; normalize errors → ~60% error reduction.
- M2: Logger, quality engine, workspace generics → 80% reduction.
- M3: Full green build; add `typecheck:full` for complete tree; `typecheck:cli` remains for incremental flow.

