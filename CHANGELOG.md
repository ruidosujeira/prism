# Changelog

All notable changes to this project will be documented in this file. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Multi-region deployment blueprints (tracked in `docs/roadmap.md`).
- Additional provenance surfaces (signatures, SBOM export) – design in progress.

### Changed

- Evaluating gRPC streaming for ingest to improve e2e latency.

### Fixed

- Pending items will be tracked here as they land.

## [0.2.0] - 2025-11-21 — "Prism Platform"

### Added

- `@prism/cli` binary with `publish`, `info`, and `resolve` commands wired to the `/v1` API surface.
- `@prism/storage-s3` driver plus backend storage factory (`PRISM_STORAGE_DRIVER`, `PRISM_S3_*`).
- `apps/dashboard` React/Vite console surfacing packages, versions, runtime resolutions, and provenance cues.
- `/v1/packages` REST collection, manifest-aware version endpoint, and runtime-aware `/v1/resolve`.
- Enterprise documentation suite (`README.md`, `CHANGELOG.md`, `docs/*.md`).

### Changed

- Backend build chain executes shared → core → storage → backend → web → dashboard → CLI sequentially for deterministic artifacts.
- Publish pipeline validates route name vs. manifest name before accepting tarballs.
- Resolver now hangs off `/v1/resolve` and unifies storage usage through the factory.

### Fixed

- Normalized exported path handling during publish to avoid stray `./` and `package/` prefixes.

## [0.1.0] - 2025-10-01 — "Initial Prism Core"

### Added

- Fastify backend with ingest analyzers, diffing, and filesystem metadata persistence.
- Shared schema library (`@prism/shared`) plus resolver core package (`@prism/core`).
- Next.js explorer for browsing packages.
