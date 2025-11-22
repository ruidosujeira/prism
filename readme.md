- @prism/web
  - Minimal UI: browse, versions, exports map, file tree.
- Storage drivers
  - In-memory, filesystem, S3 (stub/driver).

Interaction
```
CLI/HTTP → @prism/backend → @prism/core → storage driver
                              ↑
                        @prism/shared
```

See ARCHITECTURE.md for deeper flows and constraints.

References
- Architecture map: docs/architecture-map.txt
- Dependency graph: docs/dependency-graph.md
- Roadmap: docs/roadmap.md

---

## API Overview

Base URL: http://localhost:4000/v1

Publish
```
POST /v1/packages/:name
Headers: x-publisher-id: dev-local
Body (multipart): tarball, version, runtime?, metadata?

Response 201
{
  "name": "@acme/pkg",
  "version": "1.0.0",
  "manifestId": "sha256-…"
}
```

Metadata
```
GET /v1/packages/:name
→ package meta, latest, dist-tags, manifests summary
```

Versions
```
GET /v1/packages/:name/versions
→ ["1.0.0", "1.1.0"]
```

Resolve
```
GET /v1/resolve/:name?range=^1&runtime=node
→ {
  "name": "@acme/pkg",
  "version": "1.1.0",
  "exports": { "import": "./dist/index.js", "types": "./dist/index.d.ts" },
  "tarball": "https://…/tarballs/@acme/pkg-1.1.0.tgz"
}
```

Tarball
```
GET /v1/tarballs/:name-:version.tgz
→ streams the artifact
```

---

## CLI

Local publish
```bash
prism publish ./dist/pkg-1.0.0.tgz --name @acme/pkg --version 1.0.0
```

Local resolve
```bash
prism resolve @acme/pkg --range ^1 --runtime node
```

Debug flags
```bash
prism publish … --verbose --dry-run
prism resolve … --json
```

---

## Storage Drivers

StorageDriver (contract)
```ts
interface StorageDriver {
  putManifest(name: string, version: string, manifest: object): Promise<void>
  getManifest(name: string, version: string): Promise<object | null>
  putTarball(name: string, version: string, data: Uint8Array): Promise<void>
  getTarball(name: string, version: string): Promise<ReadableStream | null>
}
```

Philosophy
- Strict contract tests.
- Deterministic behavior across drivers.
- No hidden side effects.

Drivers
- memory: default for dev and tests.
- filesystem: local persistence under STORAGE_ROOT.
- s3: production path, S3/MinIO compatible.

---

## Web UI

Features
- File tree viewer
- Exports map
- Runtimes (Node/Bun/Deno)
- Version diffs
- Metadata panel

Screenshots
- docs/assets/ui-package.png (placeholder)
- docs/assets/ui-version.png (placeholder)

---

## Testing

- Unit tests: schema, resolver, analyzers.
- Contract tests: StorageDriver across memory/fs/s3.
- E2E: publish → list → resolve → tarball.

Run
```bash
pnpm -w test
```

---

## Contributing

- Use pnpm. Keep commits small and scoped.
- TypeScript, ESM only.
- Add/extend contract tests when touching storage or resolver.
- Update README and ARCHITECTURE.md when changing flows.

PR checklist
- [ ] Tests added/updated
- [ ] Types tight, no any
- [ ] Docs updated (README/ARCHITECTURE/CHANGELOG)
- [ ] No dead code, no TODOs

Local dev
```bash
pnpm install
pnpm dev
open http://localhost:4000/docs
```

---

## Roadmap

- Auth: OIDC/JWT, per-team tokens
- Provenance: Sigstore/Rekor, policy eval
- Resolver: CDN edge cache, Redis hot manifests
- Storage: multi-region, GCS/Azure drivers
- Search: index + ranking
- UI: diffs, provenance timeline

---

## License

MIT © Prism contributors
- Roadmap: docs/roadmap.md

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


---

## NPM Compatibility

Prism ships an opt-in, isolated npm-compat router that serves a minimal subset of the npm registry protocol. This allows common tooling (npm, pnpm, Yarn, Bun) to fetch metadata and tarballs from Prism.

Supported endpoints (read-only unless noted):

- GET /:package – npm-style package metadata document with:
  - name
  - dist-tags (includes at least latest)
  - versions (map of version → manifest + dist info)
  - time (created, modified, per-version timestamps)
  - description, license, repository, etc.
- GET /:package/:version – npm-style document for a specific version
- GET /:package/-/:tarball – tarball download, e.g. /my-pkg/-/my-pkg-1.2.3.tgz
- PUT /-/package/:name/dist-tags/:tag – set a dist-tag to a specific version (minimal write support)

Notes
- Dist-tags: On publish, Prism automatically sets/updates the latest tag to the highest version present for the package. Additional tags can be set via the endpoint above.
- Semver: Range resolution is supported internally and used by client tooling after fetching metadata. A dedicated resolver also exists at /v1/resolve for Prism-native flows.
- Auth: The compat layer currently allows unauthenticated access. A preHandler hook is in place where token-based auth can be added in the future.

Pointing npm clients at Prism

You can point npm/pnpm/Yarn/Bun to Prism by setting the registry to your Prism backend base URL (the npm-compat router is mounted at the root):

Example .npmrc
```
registry=http://localhost:4000/
```

CLI examples
```
npm config set registry http://localhost:4000/
pnpm config set registry http://localhost:4000/
yarn config set registry http://localhost:4000/
```

Limitations (current)
- Advanced auth features (tokens, scoped permissions) not implemented.
- Organization scopes beyond naming are not specially handled.
- Partial npm protocol coverage: enough for install flows that rely on metadata, versions, tarballs, and dist-tags.
