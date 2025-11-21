# Prism Platform

Prism is a production-grade JavaScript runtime registry for teams that outgrew npm Enterprise mirrors and ad-hoc Verdaccio servers. It ingests tarballs, performs deterministic analysis, persists runtime-aware manifests, and serves low-latency resolution APIs, a CLI, and a dashboard for operators.

## Why Another Registry?

- **npm-style mirrors leak control.** Stock npm proxies replicate metadata as-is, so security, provenance, and runtime-specific exports remain opaque.
- **Verdaccio still feels single-tenant.** It is great for hobby mirrors, but observability, multi-runtime exports, and provenance reporting require invasive plugins.
- **Platform teams need opinionated workflows.** Internal registries must prove who published what, how it was analyzed, and which runtime entry points are safe to consume.

## Who Is Prism For?

- **Platform/SRE teams** that want a self-hosted registry with provenance, analyzer hooks, and deterministic manifesting.
- **Regulated companies** that need reproducible audit trails, strict metadata validation, and storage isolation (filesystem or S3/MinIO).
- **Hobby or OSS maintainers** experimenting with runtime-aware delivery who still want a batteries-included CLI + dashboard.

## Quickstart

```bash
pnpm install
pnpm dev             # spins up backend + dashboard locally

# In another terminal
open http://localhost:4000/docs   # Fastify API explorer
open http://localhost:4173        # Dashboard once Vite boots
```

What to expect:

- Backend listening on `http://localhost:4000` with `/v1` APIs.
- Dashboard proxying against the backend via `VITE_PRISM_API_URL`.
- File artifacts written to `./storage` (configurable via `STORAGE_ROOT`).

See `docs/development.md` for deeper workflows and `pnpm dev:*` scripts.

## Architecture At a Glance

The components below are expanded in [ARCHITECTURE.md](./ARCHITECTURE.md), including publish/install/auth flows and decision records.

Prism is a modern registry stack composed of:

- **@prism/shared** – canonical Zod schemas, hashing utilities, and normalization helpers.
- **@prism/core** – manifest model, resolver, and pluggable storage abstraction.
- **@prism/cli** – the developer-facing `prism` binary used to publish, inspect, and resolve packages.
- **prism-registry-backend** – Fastify service that accepts publish requests, stores artifacts, exposes REST APIs, and powers the resolver.
- **prism-registry-web** – the existing Next.js explorer.
- **prism-dashboard** – a Vite/React operational console.
- **@prism/storage-s3** – production-grade manifest storage backed by Amazon S3 (or any S3-compatible endpoint).

## Why Prism

- **Deterministic ingestion** – every tarball is hashed, re-parsed, and normalized before it is accepted.
- **Runtime awareness** – manifests record exports per runtime so Bun/Deno/Node consumers receive the right entry.
- **Transparent provenance** – metadata captures release cadence, integrity, diff snapshots, and analyzer tags.
- **Composable storage** – manifests can live in-memory for development, on the filesystem, or inside S3 without code changes.
- **Operator ergonomics** – CLI flows, API ergonomics, and dashboard widgets are written for senior platform teams.

## Features

- Publish pipeline with analyzers (exports, runtime compatibility, file trees, diffing, provenance scoring).
- Runtime resolver that understands `node`, `deno`, and `bun`, including types URLs and base URL overrides.
- Search index scaffolding for future relevancy ranking.
- Storage drivers: in-memory (default), filesystem (local dev), and S3 (production).
- React dashboard with package list, detail, and version deep dives plus live runtime resolutions.
- Enterprise documentation set (`docs/`) plus CHANGELOG tracking semantic releases.

## Production Readiness Snapshot

| Capability                         | What Exists Today                                                                                  | Roadmap Notes                                                                                       |
| ---------------------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| **Authentication & Authorization** | Backend ships with middleware hooks and mock publisher identity via CLI headers.                   | Pluggable OIDC/JWT auth, per-team tokens, and publish policies tracked in `docs/roadmap.md`.        |
| **Artifact Storage**               | Filesystem storage plus optional `@prism/storage-s3` driver (S3/MinIO).                            | Multi-region replication + pluggable blob stores (GCS, Azure) in planning.                          |
| **Provenance & Auditing**          | Deterministic manifests, analyzer tags, SHA-256 digests, diff metadata.                            | Sigstore/Rekor attestations + policy evaluation incoming.                                           |
| **Observability**                  | Fastify logging, structured ingest logs, dashboard surfacing analyzer output.                      | OpenTelemetry exporters, audit event bus, and alert hooks queued.                                   |
| **Scaling & Distribution**         | Stateless Fastify backend, resolver backed by Prisma storage abstractions, CDN/base URL overrides. | Horizontal sharding, Redis cache for hot manifests, and resolver CDN edges (see `docs/roadmap.md`). |

This table should evolve alongside implementation to keep the "production-grade" promise grounded.

## High-level Architecture

```
                 +---------------------+
                 |    prism dashboard   |
                 +----------+----------+
                            |
                 +----------v----------+
    prism CLI -->|  Fastify backend    |<-- web explorer / automation
   (publish,     |  /v1 REST + resolve |             |
    info, resolve)----------+----------+             |
                            |                        |
                    +-------v--------+       +------v---------+
                    |  ingest pipe   |       |  core resolver |
                    |  analyzers     |       |  runtime logic |
                    +-------+--------+       +------^---------+
                            |                       |
                    +-------v-----------------------+-----+
                    |      Prism storage abstraction      |
                    +-------+-----------------------------+
                            |
        +-------------------+-------------------+
        |                   |                   |
 in-memory (dev)   filesystem manifests   S3 manifests
```

## Monorepo Layout

```
prism/
├─ packages/
│  ├─ shared/         # Schemas + hashing helpers
│  ├─ core/           # Resolver + storage contracts
│  ├─ backend/        # Fastify API + ingest pipeline
│  ├─ web/            # Next.js explorer (existing UI)
│  ├─ cli/            # @prism/cli binary
│  └─ storage-s3/     # S3-backed PrismStorage driver
├─ apps/
│  └─ dashboard/      # React/Vite operator console
├─ docs/              # Detailed product & ops guides
├─ CHANGELOG.md
└─ infra/             # Deployment & ops tooling
```

## Registry HTTP API Overview

| Method | Path                                         | Description                                                                   |
| ------ | -------------------------------------------- | ----------------------------------------------------------------------------- |
| `POST` | `/v1/packages/:name`                         | Publish a package tarball (body conforms to `PublishPayload`).                |
| `GET`  | `/v1/packages`                               | List all packages with latest version + tags.                                 |
| `GET`  | `/v1/packages/:name`                         | Fetch package summary (latest version, tags, versions array).                 |
| `GET`  | `/v1/packages/:name/:version`                | Fetch version metadata plus stored Prism manifest.                            |
| `GET`  | `/v1/packages/:name/:version/files`          | Return file tree snapshot captured during ingestion.                          |
| `GET`  | `/v1/packages/:name/:version/diff/:previous` | Produce diff artifacts between two versions.                                  |
| `GET`  | `/v1/resolve?spec=foo@1.0.0&runtime=node`    | Resolve an entry-point URL for the given runtime (optionally pass `baseUrl`). |

Full payload definitions live in `docs/api.md` and `packages/shared/src/schemas`.

## CLI Usage

```bash
pnpm --filter @prism/cli build   # or pnpm dlx prism once published
PRISM_REGISTRY_URL=http://localhost:4000 prism info prism-registry-backend
PRISM_REGISTRY_URL=http://localhost:4000 prism resolve @scope/pkg@latest --runtime=deno

# Publishing from a package directory
PRISM_REGISTRY_URL=http://localhost:4000 \
  PRISM_PUBLISHER_NAME="Jane Ops" \
  prism publish
```

The binary reads `package.json`/`prism.json`, tars the working directory (ignoring `node_modules`, build artifacts, VCS folders), computes the SHA-256 digest, and posts to `/v1/packages/:name`. Configure the registry host with `PRISM_REGISTRY_URL` (defaults to `http://localhost:3333`).

## Dashboard Overview

- Located in `apps/dashboard` (Vite + React Router).
- Reads `VITE_PRISM_API_URL` to discover the backend host.
- Pages: package list, package detail (versions grid), and version detail with manifest, exports, runtime resolutions, distribution, and provenance.
- Links back to `docs/` for deep dives, and surfaces analyzer tags alongside runtime badges.

## Storage Options

- **memory** (default) – uses `InMemoryPrismStorage`; best for tests and demo servers. Set `PRISM_STORAGE_DRIVER=memory`.
- **filesystem** – uses `FilesystemPrismStorage` (configured in `storage/prismStorage.ts`) for quick local persistence. Set `PRISM_STORAGE_DRIVER=filesystem`.
- **s3** – provided by `@prism/storage-s3`. Configure via `PRISM_STORAGE_DRIVER=s3` plus `PRISM_S3_BUCKET`, `PRISM_S3_REGION`, optional `PRISM_S3_ENDPOINT`, `PRISM_S3_ACCESS_KEY_ID`, `PRISM_S3_SECRET_ACCESS_KEY`.

Regardless of manifest driver, package metadata/tarballs continue to live on the filesystem under `STORAGE_ROOT` to keep the ingest pipeline predictable.

## Provenance System

During publishing the backend:

1. Streams the tarball, validates SHA-256 integrity, and inspects `package.json`.
2. Runs analyzers (`analyzeExports`, `analyzeRuntime`, `analyzeFileTree`, `analyzeSizes`).
3. Computes tags (zero dependencies, typed, runtime flags) and maturity scores.
4. Writes metadata (diff-friendly JSON), tarball, and Prism manifest to the configured storage driver.
5. Updates the search index to keep CLI/dashboard queries fresh.

The resulting metadata includes release cadence, checksum, file tree, distribution stats, and analyzer tags—available via `/v1/packages/:name/:version`.

## Development

```bash
pnpm install

# Run backend + web explorer + dashboard
pnpm dev

# Focused workflows
pnpm dev:backend
pnpm dev:web
pnpm dev:dashboard

# Build every workspace sequentially (shared → core → storage → backend → web → dashboard → cli)
pnpm build
```

Key environment variables:

- `PORT`, `STORAGE_ROOT`, `PRISM_PUBLIC_BASE_URL`
- `PRISM_STORAGE_DRIVER`, `PRISM_S3_*`
- `PRISM_REGISTRY_URL`, `PRISM_PUBLISHER_NAME`, `PRISM_PUBLISHER_EMAIL` (CLI)
- `VITE_PRISM_API_URL` (dashboard)

## Testing

- `pnpm typecheck` – runs `tsc --noEmit` for every workspace.
- `pnpm --filter prism-registry-backend test` – add integration/unit coverage as the backend matures.
- Dashboard/CLI rely on TypeScript type-checks; add Vitest/Cypress as desired (see `docs/development.md`).

## Roadmap

- Track planned workstreams in `CHANGELOG.md` and `docs/roadmap.md`.
- Near-term initiatives include: resolver CDN edges, provenance attestation uploads, search/index APIs, and deeper UI telemetry.

## License

MIT © Prism authors
