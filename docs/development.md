# Development Guide

## Prerequisites

- Node.js 18+
- pnpm 9+
- Optional: Docker (if you plan to run supporting services), AWS credentials for S3 driver testing

## Install & Bootstrap

```bash
pnpm install
```

This installs dependencies for every workspace and links them via pnpm’s workspace protocol (`workspace:*`).

## Common Scripts

| Command              | Description                                                                        |
| -------------------- | ---------------------------------------------------------------------------------- |
| `pnpm dev`           | Runs backend (Fastify), web explorer (Next.js), and dashboard (Vite) concurrently. |
| `pnpm dev:backend`   | Fastify backend with tsx/hot reload.                                               |
| `pnpm dev:web`       | Next.js explorer dev server.                                                       |
| `pnpm dev:dashboard` | Dashboard dev server (Vite).                                                       |
| `pnpm build`         | Sequential builds: shared → core → storage-s3 → backend → web → dashboard → cli.   |
| `pnpm typecheck`     | `tsc --noEmit` across all workspaces.                                              |

## Debugging Tips

- Use `LOG_LEVEL=debug` (Fastify env) to see request logs.
- Run `PRISM_STORAGE_DRIVER=filesystem` locally to inspect manifest files under `storage/packages/...`.
- CLI accepts `--dir` for path overrides and will log thrown errors verbosely.
- Dashboard uses browser devtools; API requests go directly to `VITE_PRISM_API_URL`.

## Testing Strategy

1. **Type checking** – enforced via `pnpm typecheck` in CI; catches most integration issues due to shared types.
2. **Unit tests** – add Vitest/Jest suites per package (`pnpm --filter <pkg> test`).
3. **Integration smoke** – script idea: publish fixture via CLI → hit `/v1` endpoints → resolve for each runtime (outlined in `docs/roadmap.md`).

## Coding Standards

- Prefer explicit exports (`export interface Foo {}`) over `default`.
- Keep shared utilities under `@prism/shared` to avoid drift.
- Use the storage factory instead of instantiating storage drivers directly.
- Add concise comments only when logic is non-obvious (especially around analyzers or resolver edge cases).

## Releasing

1. Update `CHANGELOG.md` with a new section and ensure `version` bumps in affected packages.
2. Run `pnpm build` + `pnpm typecheck`.
3. Publish libraries (`@prism/*`) using `pnpm publish --filter` or via CI.
4. Tag the repo (`git tag v0.x.x && git push origin --tags`).

See `docs/roadmap.md` for upcoming CI automation tasks (release orchestration, SBOM generation, canary environments).
