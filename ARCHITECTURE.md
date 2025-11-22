# Prism Registry Architecture

Prism is a pnpm-powered monorepo that packages every registry concern—schemas, resolver, backend, CLI, storage drivers, and dashboard—under a single toolchain. Shared configs keep TypeScript, Vitest, ESLint, and build tooling aligned across workspaces while `docs/` and `infra/` host operational runbooks and deployment helpers.

```
prism/
  packages/
    shared/      # schemas, types, validation helpers
    core/        # resolver + storage abstractions
    backend/     # Fastify API, ingestion pipeline, analyzers
    cli/         # developer binary for publish/info/resolve
    storage-s3/  # S3-compatible PrismStorage implementation
  apps/
    dashboard/   # React/Vite operator console
  docs/          # product, API, and operations guides
  infra/         # deployment + automation tooling
```

## Tooling Decisions

- **Package manager:** pnpm workspaces for deterministic installs and shared scripts.
- **Language:** TypeScript everywhere for a single type graph.
- **Build tooling:** `tsup` (libraries/backends), Vite (dashboard), Fastify + `tsx` for local backend entry points.
- **Validation:** Zod schemas live in `@prism/shared` so backend, CLI, and dashboard enforce the same contracts.
- **Testing:** Vitest (node + jsdom) with Fastify inject for API tests and Testing Library for UI components.

## Component Overview

| Layer                    | Responsibilities                                                                        |
| ------------------------ | --------------------------------------------------------------------------------------- |
| `@prism/shared`          | Zod schemas, hash/provenance helpers, normalization utilities.                          |
| `@prism/core`            | Spec parsing, semver resolution, runtime-specific entry selection, storage abstraction. |
| `prism-registry-backend` | Fastify server, ingest pipeline, analyzers, persistence orchestration, REST APIs.       |
| `@prism/cli`             | Publish/info/resolve commands, tarball builder, provenance header injection.            |
| `@prism/storage-s3`      | Production-ready manifest store backed by S3/MinIO-compatible endpoints.                |
| `apps/dashboard`         | Vite/React operator UI surfacing packages, versions, analyzer output, provenance.       |

## Core Flows

### Publish Flow

1. **Authenticate publisher** via CLI headers (placeholder) or future JWT/OIDC middleware hooks.
2. **POST `/v1/packages/:name`** streams the tarball and metadata validated against `PublishPayload`.
3. **Ingest pipeline** stages artifacts, verifies SHA-256 digests, and rehydrates `package.json` for deterministic metadata.
4. **Analyzers** run sequentially: exports/types detection, runtime compatibility, file tree + sizes, provenance scoring, diff against previous version.
5. **Persistence** writes canonical metadata and Prism manifest through the configured `PrismStorage` driver (memory/filesystem/S3) and saves the raw tarball on disk.
6. **Indexing** updates search/runtime caches so CLI + dashboard queries stay warm.
7. **Response** returns stored manifest, analyzer summaries, provenance digests, and public artifact URLs.

### Resolve / Install Flow

1. Client (CLI, automation, dashboard) calls `GET /v1/resolve?spec=<name>@<range>&runtime=<node|deno|bun>`.
2. Resolver in `@prism/core` parses range operators, fetches manifests via `PrismStorage`, and picks the highest version satisfying the range.
3. Runtime-specific exports (`node`, `deno`, `bun`, `.`, `default`) determine the entry path and format; fallbacks scan canonical file lists when exports are absent.
4. URLs are emitted relative to `/packages/<name>/<version>/...` or rewritten with `PRISM_PUBLIC_BASE_URL` so callers can hit CDN/object-storage edges directly.

### Authentication & Authorization Flow

- **Current state:** CLI embeds `PRISM_PUBLISHER_NAME/EMAIL` headers. Backend uses a lightweight allowlist middleware for trusted publishers.
- **Planned:** pluggable module supporting OIDC tokens, service accounts for CI, scoped API keys, and signed download URLs for private assets (see `docs/roadmap.md`).

## Data & Storage Decisions

- **Manifests** live behind the `PrismStorage` interface. Filesystem driver is default for local dev/tests, while `@prism/storage-s3` unlocks production durability (S3/MinIO/R2).
- **Tarballs** remain on disk under `STORAGE_ROOT` to keep ingestion predictable and allow checksum replays.
- **Indexes** (search, runtime cache) are JSON snapshots today; roadmap includes Elastic/OpenSearch or SQLite for richer querying.
- **Database compatibility:** No relational DB is required yet; JSON artifacts stay diff-friendly and GitOps friendly.

## Observability & Operations

- Fastify structured logs with request IDs around ingest + analyzer stages.
- Analyzer telemetry (duration, verdicts) streamed to the dashboard.
- Hooks prepared for OpenTelemetry exporters, log sinks (CloudWatch/Loki), and audit webhooks—documented in `docs/observability` (upcoming).
- Dashboard exposes provenance tags, runtime flags, and diff metadata so operators can triage without tailing logs.

## Scaling Model

- **Stateless API nodes** behind a load balancer; storage driver is the only shared dependency.
- **Caching:** Resolver keeps a per-node LRU cache; design allows Redis/KeyDB plug-ins when hot package churn increases.
- **CDN support:** `baseUrl` option rewrites resolved URLs so artifacts can be replicated to edge buckets/CDNs while metadata continues to live on the backend.
- **Sharding:** S3 paths are namespaced per package/version, enabling bucket/per-prefix sharding at scale.

## Compatibility Notes

- Prism is not a drop-in npm registry. The CLI speaks Prism-native REST endpoints to access richer runtime/provenance data.
- A metadata adapter that outputs npm-style responses is planned but intentionally decoupled to keep manifests runtime-aware.
- Backwards compatibility is enforced via `@prism/shared` schema versioning; new analyzer fields are additive and flagged via semver.

## API Surface

- `POST /v1/packages/:name` — publish a package version.
- `GET /v1/packages` — list packages with latest tags.
- `GET /v1/packages/:name` — package summary + versions array.
- `GET /v1/packages/:name/:version` — version metadata and Prism manifest.
- `GET /v1/packages/:name/:version/files` — snapshot of the extracted file tree with size information.
- `GET /v1/packages/:name/:version/diff/:previous` — analyzer-produced diff artifacts.
- `GET /v1/resolve` — runtime-aware resolver endpoint returning entry URLs, types URLs, and provenance metadata.

## References

- [docs/development.md](./docs/development.md) — local workflows and scripts.
- [docs/registry-model.md](./docs/registry-model.md) — canonical metadata schema.
- [docs/provenance.md](./docs/provenance.md) — analyzer + provenance model.
- [docs/roadmap.md](./docs/roadmap.md) — sequencing for auth, observability, and scaling milestones.
- [docs/architecture-map.txt](./docs/architecture-map.txt) — concise textual architecture map.
- [docs/dependency-graph.md](./docs/dependency-graph.md) — workspace package dependency graph.
- [docs/final-audit-report.md](./docs/final-audit-report.md) — final audit, PR plan, checklist, and stability notes.
