# Registry Model

Prism uses two primary artifacts per version: the **Version Metadata** document and the **Prism Manifest**. Both are JSON files with strong typing enforced by Zod schemas in `@prism/shared` and `@prism/core`.

## Version Metadata (`packages/backend` → `metadata.json`)

- `identifier`: `{ name, version }` (normalized, semver validated).
- `description`, `keywords`, `license`, `repository`, `homepage` – copied from `package.json` after validation.
- `dist`: `{ tarball, integrity, fileName }` – deterministic relative paths plus sha256 integrity strings.
- `files`: `{ totalFiles, totalDirectories, tree }` – snapshot from `analyzeFileTree`.
- `distribution`: `{ rawBytes, gzipBytes }` – aggregated size data.
- Dependency maps: `dependencies`, `devDependencies`, `peerDependencies`, `optionalDependencies` (default `{}`).
- `exports`: normalized map derived from `package.json` exports (conditional keys resolved to strings).
- `runtime`: compatibility booleans/strings plus analyzer tags.
- `tags`: computed from runtime results, dependency counts, and dist size (e.g., `tiny`, `typed`, `zero-deps`).
- `release`: timestamps, maturity score, optional cadence metrics.
- `checksum`: hashed tarball digest via `toHashDigest(sha256)`.

## Prism Manifest (`manifest.json`)

Stored via the `PrismStorage` abstraction (filesystem, in-memory, or S3). Fields:

- `name`, `version` – same identifier.
- `files` – flat array of file paths for quick membership checks.
- `integrity` – sha512 digest used by runtime loaders.
- `types` – optional `.d.ts` or `.ts` entry.
- `exports` – string map of runtime selectors (`node`, `deno`, `bun`, `.`, `default`, etc.).
- `runtimes` – boolean hints (true if analyzer marked runtime as compatible).
- `metadata` – passthrough object for future enrichments (e.g., repository info, license).

## Relationships

```
VersionMetadata ---- references ----> PrismManifest
       |                                 |
       |---- dist.tarball (filesystem) ---+
       |---- files.tree ------------------> diff + dashboard visualizations
       |---- runtime.tags ----------------> dashboard badges & search index
```

## Access Patterns

- `/v1/packages/:name/:version` returns `{ metadata, manifest }`.
- CLI `prism info` hits `/v1/packages/:name` (summary only).
- `/v1/packages/:name/:version/files` streams the tree for deep comparisons.
- `/v1/resolve` loads the manifest to determine runtime-specific entry points.

## Validation

- All inputs are parsed through Zod schemas inside `@prism/shared` (see `schemas/metadata.ts`, `schemas/publish.ts`).
- Storage drivers validate manifests via `isValidPrismManifest` (exported by `@prism/core`).
- Publish pipeline re-validates after normalization to prevent inconsistent casing or pathing from reaching storage.
