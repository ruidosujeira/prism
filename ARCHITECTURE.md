# Prism Registry Architecture

Prism is organized as a pnpm-powered monorepo with three primary workspaces: the backend registry core, the shared schema/types package, and the optional web experience. Supporting infrastructure (docker images, operational scripts) lives under `infra/`.

```
prism/
  packages/
    backend/   # REST API, ingestion pipeline, analyzers, persistence
    shared/    # Schemas, type contracts, deterministic validation helpers
    web/       # Next.js UI (optional during foundation work)
  infra/
    docker/    # Future container images, runtime setups
    scripts/   # Operational scripts for maintenance/indexing
```

## Tooling Decisions

- **Package Manager:** pnpm workspaces with lock-step TypeScript versioning; deterministic installs and hoisting control.
- **Language:** Node.js + TypeScript across all packages.
- **Build Tooling:** `tsup` for libraries/services for fast ESM+CJS output, `ts-node`/`tsx` for local dev entry points, Next.js App Router for the web.
- **Validation:** Zod for schema-first validation within `prism-shared`; avoids custom validation duplication.
- **Testing (future):** Vitest for unit coverage, supertest for API-level testing (not part of initial bootstrap but planned).

## Backend Overview

- **Server:** Fastify-powered HTTP server for deterministic routing, JSON schema validation, and performance.
- **Modules:**
  - `api/` — route handlers for publish and read endpoints.
  - `ingest/` — tarball handling, metadata parsing, analyzer orchestration.
  - `storage/` — deterministic filesystem layout (packages/{name}/{version}).
  - `analyzers/` — modular analyzers (metadata, file tree, runtime compatibility, size, diff, indexing).
  - `services/` — orchestrators for persistence, search index maintenance, diff generation.
  - `types/` — re-export type contracts from `@prism/shared` for convenience.
- **Data Layout:**
  - `storage/packages/<normalized-name>/<version>/metadata.json` — canonical metadata.
  - `storage/packages/<normalized-name>/<version>/tarball.tgz` — original artifact.
  - `storage/search/index.json` — search index snapshot.
  - `storage/runtime/flags.json` — runtime compatibility cache.

## Shared Package Responsibilities

- Zod schemas + TypeScript types for:
  - Package metadata
  - Version metadata
  - File tree nodes
  - Analyzer outputs (sizes, exports, runtime flags)
  - Version diff payloads
  - Publish payload validation
- Shared utilities:
  - Name/version normalization
  - Hash helpers (sha256 wrappers)
  - Tarball helper interfaces

## Publish Flow (High-Level)

1. **POST /publish** receives multipart or JSON-encoded tarball reference.
2. **Ingest** writes tarball to temp dir, validates sha256, extracts package manifest.
3. **Analyzers** execute sequentially:
   - manifest metadata extraction
   - dependency graph + maturity metrics
   - file tree + size calculation (raw + gzip)
   - runtime compatibility classification
   - exports/types detection
4. **Persistence** writes canonical metadata + tarball to storage layout, updates search index + runtime cache.
5. **Response** returns stored version metadata referencing canonical storage path and analyzer outcomes.

## API Surface (Initial)

- `POST /publish` — ingest new package version.
- `GET /package/:name` — latest metadata + versions.
- `GET /package/:name/:version` — version metadata payload.
- `GET /package/:name/:version/files` — file tree w/ size metrics.
- `GET /package/:name/:version/diff/:previous` — deterministic diff data.

## Next Steps

- Scaffold pnpm workspace + base configs.
- Build shared schemas, then backend scaffolding.
- Add optional Next.js skeleton once core registry foundation is in place.
