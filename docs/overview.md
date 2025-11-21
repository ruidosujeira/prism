# Prism Overview

Prism is an application-runtime registry that treats package ingestion, metadata, and resolution as critical infrastructure. It ingests tarballs, analyzes runtime characteristics, stores provenance-rich manifests, and exposes ergonomic tooling for operators and SDK teams.

## Vision

- **Determinism** – ingestion re-parses every manifest, normalizes exports, and validates file trees before storage.
- **Transparency** – every publish emits a manifest, provenance block, diffable metadata, and analyzer tags.
- **Runtime empathy** – Node, Deno, and Bun are first-class citizens with dedicated entry points and compatibility scoring.
- **Operational excellence** – CLI, dashboard, docs, and APIs are written for platform teams that need clarity at scale.

## Building Blocks

| Layer                    | Responsibility                                                         |
| ------------------------ | ---------------------------------------------------------------------- |
| `@prism/shared`          | Zod schemas, hashing helpers, normalization utilities.                 |
| `@prism/core`            | Manifest contracts, resolver, storage abstraction, runtime config.     |
| `@prism/storage-s3`      | Production manifest storage for S3 or compatible endpoints.            |
| `prism-registry-backend` | Fastify ingest API, analyzers, provenance pipeline, REST surface.      |
| `@prism/cli`             | Publish/info/resolve flows for developers and CI.                      |
| `prism-dashboard`        | React/Vite operator console for packages, versions, and runtime views. |
| `prism-registry-web`     | Existing Next.js explorer (public-facing UI).                          |

## Lifecycle

1. **Publish** – A tarball is created (CLI), hashed, and POSTed to `/v1/packages/:name`.
2. **Ingest** – The backend inspects files, computes tags, records provenance, and persists manifests + metadata.
3. **Index** – Package summaries are updated for list/info endpoints and dashboard views.
4. **Resolve** – Runtimes call `/v1/resolve?spec=...&runtime=...` (or use the CLI) to obtain URLs with integrity metadata.
5. **Observe** – Operators use the dashboard and docs/metrics to make release decisions.

## Resources

- [`docs/api.md`](./api.md) – REST reference.
- [`docs/provenance.md`](./provenance.md) – ingest + metadata internals.
- [`docs/storage.md`](./storage.md) – storage drivers and configuration.
- [`docs/roadmap.md`](./roadmap.md) – near-term and speculative initiatives.
