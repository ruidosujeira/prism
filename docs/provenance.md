# Provenance & Ingest Pipeline

Prism treats every publish as a reproducible analysis job. The ingest pipeline is implemented in `packages/backend/src/ingest/publishPipeline.ts` and executes synchronously for now (streaming/offloading is on the roadmap).

## Steps

1. **Checksum validation** – tarball bytes decoded from base64, hashed via SHA-256, compared against payload.
2. **Extraction & manifest summary** – `inspectTarball` produces file entries and the raw `package.json`; `summarizeManifest` normalizes identifiers/fields.
3. **Name enforcement** – if the route param (`/v1/packages/:name`) does not match the manifest name (after normalization), the publish is rejected.
4. **Analyzers**:
   - `analyzeRuntime` – determines compatibility + tags per runtime.
   - `analyzeExports` – collects export statements for metadata and manifests.
   - `analyzeFileTree` – builds hierarchical snapshot for UI + diffing.
   - `analyzeSizes` – calculates raw/gzip byte counts by directory.
5. **Tagging & scoring** – `determineTags` marks typed/tiny/zero-deps etc., `computeMaturityScore` derives a heuristic from the version.
6. **Metadata construction** – see [`docs/registry-model.md`](./registry-model.md) for the full schema.
7. **Manifest creation** – `buildPrismManifest` writes `manifest.json` (with sha512 integrity) to the configured `PrismStorage` driver.
8. **Persistence** – tarball + metadata go to the filesystem repository, manifest to storage, search index updated.

## Provenance Fields

- `checksum` – `sha256-...` string stored alongside metadata and surfaced via API/UI.
- `release.publishedAt` – ISO timestamp when the backend processed the publish.
- `release.maturityScore` – 0–100 heuristics; use to flag experimental vs. stable.
- `release.previousVersion` & `release.releaseFrequencyDays` – simple indicators for ops teams.
- Analyzer `tags` – e.g., `typed`, `zero-deps`, `tiny`, `runtime-node`.

## Future Enhancements

- **Signing** – attach Sigstore/Rekor bundle or Cosign signature per manifest (see `docs/roadmap.md`).
- **SBOM** – export CycloneDX or SPDX manifest for downstream scanners.
- **Async analyzers** – offload expensive work (e.g., AST linting) to a job queue while still gating publish on baseline checks.
