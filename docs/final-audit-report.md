### Prism Registry — Final Engineering Audit (v0.1.x)

This document is the principal engineer’s final audit of the Prism Registry codebase. It covers the current architecture, quality posture, weak points, a checklist for GA-hardening, and a sequenced set of atomic PRs for a final refactor pass. It concludes with stability and technical debt assessments.

Scope and inputs
- Monorepo: pnpm workspaces with packages: @prism/shared, @prism/core, prism-registry-backend, prism-registry-web, apps/dashboard, @prism/cli, @prism/storage-s3.
- Languages/tooling: TypeScript, Vitest, Fastify, Vite, Zod, tsup.

Key takeaways
- Architecture is cleanly layered with contracts in @prism/shared and storage abstraction in @prism/core. Backend composes analyzers and persistence through this abstraction.
- Developer experience is strong: consistent TypeScript config, workspace scripts, and local dev targets; tests run across packages.
- Weak points are concentrated in: naming inconsistencies, export normalization duplication, mixture of Portuguese/English in docs, and partially complete error handling and logging strategies.
- Storage layout was recently clarified; persistence fallback logic needs environment-hardening before GA.

1. Architecture audit
- Layering
  - Contracts: Zod schemas centralized in @prism/shared; good reuse across backend/CLI/Web.
  - Domain: @prism/core owns resolver + PrismStorage interface; in-memory default is suitable for tests.
  - Delivery: Fastify backend wires routes (publish/list/resolve); UI apps consume APIs.
  - Observability: Structured logs exist; OTEL/exporters planned.
- Boundaries and dependencies
  - Backend depends on @prism/shared and @prism/core; storage driver is pluggable (@prism/storage-s3 present).
  - Apps/web use backend APIs; no UI-business logic leakage detected.
  - See docs/dependency-graph.md for a detailed package-level map.

2. Code quality, typing, and errors
- Typing
  - Strong TypeScript usage and Zod schemas; DTOs validated on ingress; resolver paths typed.
  - Improvement: promote some implicit any/unknown paths to explicit Result types with discriminated unions for errors.
- Error handling
  - Backend installs centralized error handler; routes are simple and mostly safe.
  - Improvement: standardize error codes and shapes (problem+json style) and ensure analyzers propagate structured failures.
- Naming & consistency
  - Generally consistent; some leftover mixed-language docs (Portuguese) and a few divergent names (e.g., storage vs driver vs repository terms).
- Tests
  - Vitest across packages; backend route tests exist; resolver tests exist; S3 driver has tests.
  - Gaps: end-to-end publish→resolve smoke, negative-path tests for invalid manifests/ranges, and dashboard component tests.

3. Developer Experience (DX)
- Good: pnpm workspaces, typecheck/test scripts, dev scripts per app, Fastify docs available locally.
- Improvements: silence Fastify logger during tests via env; add a single smoke ‘pnpm -w run smoke’ that spins backend and calls basic endpoints.
- Add a contributing.md with commit conventions and release cadence notes.

4. Documentation audit
- ARCHITECTURE.md is solid; README is comprehensive but includes a mixed-language release note section.
- Gaps: a concise architecture map, explicit dependency graph, and a public roadmap—added in this audit.

5. Weak points and inconsistencies
- Storage driver selection is permissive in non-test environments; factory should fail-fast for unsupported drivers.
- Export normalization logic appears in multiple analyzers; centralize in one utility.
- Mixed-language docs; standardize on English for external artifacts.
- Error response shapes vary slightly across routes; adopt a uniform problem+json contract.
- Search index is stub-level; callers should treat results as experimental (mark as beta in API docs).

6. Final pass refactor plan (atomic PRs)
Each PR is intentionally scoped to reduce blast radius. Filenames listed to guide reviewers.

PR 1 — Standardize error contract (problem+json)
- Files:
  - packages/backend/src/utils/errorHandler.ts
  - packages/backend/src/routes/publish.ts
  - packages/backend/src/routes/packages.ts
  - packages/backend/src/routes/resolve.ts
  - packages/core/src/api/schemas.ts (add ErrorResponse schema)
- Summary: Introduce a typed ErrorResponse shape with code, message, details; update error handler to map domain errors uniformly; update route tests accordingly.

PR 2 — Centralize export normalization
- Files:
  - packages/core/src/resolver.ts
  - packages/backend/src/analyzers/exportsAnalyzer.ts (or existing analyzer touching exports)
  - packages/shared/src/utils/exports.ts (new)
- Summary: Create a single normalizeExports() utility in @prism/shared and consume it from core resolver and analyzers to remove duplication.

PR 3 — Storage factory hardening and env gates
- Files:
  - packages/backend/src/storage/storageFactory.ts
  - packages/backend/src/server.ts (init warnings)
  - packages/backend/test/setupEnv.ts
- Summary: Fail-fast when an unsupported driver is requested in non-test NODE_ENV; log clear guidance; keep in-memory only in tests/dev.

PR 4 — Logging and test ergonomics
- Files:
  - packages/backend/src/server.ts
  - packages/backend/test/** (update to assert logger disabled)
- Summary: Disable Fastify logging under test by default; expose LOG_LEVEL env; document in docs/development.md.

PR 5 — Negative-path test coverage
- Files:
  - packages/backend/test/registry-routes.test.ts (add invalid payload, conflict publish, bad semver)
  - packages/core/test/resolver.test.ts (add unsatisfied ranges, missing exports)
- Summary: Increase confidence on error paths without altering behavior.

PR 6 — Docs normalization and English-only policy
- Files:
  - README.md (release notes to English)
  - docs/ (ensure English across new files)
- Summary: Align external docs to English; keep internal comments bilingual if needed.

PR 7 — DX polish: contributing and smoke tests
- Files:
  - CONTRIBUTING.md (new)
  - package.json (new workspace script: smoke)
  - apps or scripts/smoke.ts (new minimal smoke hitting /v1 endpoints)
- Summary: Document contribution flow; add reproducible smoke test.

7. Final checklist
- [ ] Uniform error response contract implemented and documented.
- [ ] Export normalization unified under @prism/shared.
- [ ] Storage driver selection fail-fast outside tests.
- [ ] Fastify logger silenced in tests; LOG_LEVEL supported.
- [ ] Negative-path tests added for publish and resolve.
- [ ] English-only external docs; release notes normalized.
- [ ] Contributing guide and smoke script added.
- [ ] README updated with links to architecture map, dependency graph, and roadmap.

8. Stability and technical debt summary
- Expected stability: High for core flows (publish/resolve) after PRs 1–5. Storage and resolver abstractions are sound; behavior changes are minimal and focused on error shapes and internal consistency.
- Technical debt (short list): search index maturity, provenance attestation integrations, scalable caching layer, and richer observability. These are planned (see docs/roadmap.md) but not blockers for an internal GA.

9. Ownership and next steps
- Owners: Backend & core (Platform team), Shared schemas (Core), UI (DX/Apps team).
- Proceed with PRs 1–3 in parallel; PRs 4–7 can follow. Keep PRs small; target <300 LOC diffs.
