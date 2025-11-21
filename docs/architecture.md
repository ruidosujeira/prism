# Architecture

Prism is a pnpm monorepo with isolated TypeScript workspaces that share strict configs and build tooling (tsup). Each layer can be shipped independently but shares contracts through `@prism/shared` and `@prism/core`.

## Component Graph

```
+----------------+          +-----------------------+
|  CLI / CI/CD   |          |   Dashboard / Web     |
+--------+-------+          +-----------+-----------+
         |                              |
         | HTTP (REST + multipart)      |
         v                              v
                 +------------------------------+
                 |   Fastify Backend (API)      |
                 |   routes, services, ingest   |
                 +-------+--------------+-------+
                         |              |
                         |              +----------------+
                         |                               |
             +-----------v---------+          +----------v-----------+
             |  Package Repository |          |   Core Resolver      |
             |  metadata + tarball |          |  runtime selection   |
             +-----------+---------+          +----------+-----------+
                         |                               |
                         |  PrismStorage abstraction     |
                         v                               v
                 +---------------+         +------------------------+
                 | filesystem    |         |  @prism/storage-s3     |
                 | (default)     |         |  or InMemory storage   |
                 +---------------+         +------------------------+
```

### Key Notes

- **Analyzer pipeline**: `packages/backend/src/ingest/publishPipeline.ts` orchestrates tarball inspection, runtime analysis, tag derivation, and provenance scoring before persisting metadata.
- **Storage factory**: `getPrismStorage()` selects between `InMemoryPrismStorage`, `FilesystemPrismStorage`, or `S3PrismStorage` based on `PRISM_STORAGE_DRIVER`.
- **Shared contracts**: Schemas (Zod), identifier normalization, and hashing live in `@prism/shared` to avoid ad-hoc JSON structures.
- **Runtime resolver**: `@prism/core` exposes `resolveSpec` which powers `/v1/resolve`, the CLI `prism resolve`, and any future CDN edges.

## Build & Toolchain

- **TypeScript** everywhere with composite tsconfigs referencing `tsconfig.base.json` (ES2022, bundler resolution, Node typings).
- **tsup** compiles libraries/CLI/backend into dual ESM/CJS bundles with DTS output.
- **Vite** powers the dashboard for rapid iteration and pure-ESM output.
- **pnpm scripts** enforce ordered builds: shared → core → storage → backend → web → dashboard → cli.

## Data Flow

1. CLI (or CI job) publishes tarball → backend `/v1/packages/:name`.
2. Backend validates checksum, inspects files, writes metadata to disk, pushes manifest to storage driver.
3. Repository/list endpoints refresh caches; search index is updated via `searchIndexService`.
4. Dashboard/CLI consume `/v1/packages`, `/v1/packages/:name`, `/v1/packages/:name/:version`.
5. Runtimes resolve packages via `/v1/resolve` which reads manifests from storage and constructs URLs relative to `PRISM_PUBLIC_BASE_URL` or the incoming host.

## Deployment Considerations

- Backend is stateless; storage backends and the filesystem metadata root (`STORAGE_ROOT`) must be durable.
- S3 driver can point at AWS, MinIO, or Cloudflare R2; credentials are optional if IAM roles are used.
- Dashboard is a static bundle served by any CDN or via the backend as a proxy (future work tracked in `docs/roadmap.md`).
