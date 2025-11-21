# Prism CLI (`@prism/cli`)

The CLI is written in TypeScript/tsup and exposes a single binary named `prism`. It targets Node 18+ and defaults to `http://localhost:3333` unless `PRISM_REGISTRY_URL` is provided.

## Installation

```bash
pnpm install
pnpm --filter @prism/cli build
pnpm --filter @prism/cli dev   # hot reload for local hacking
```

Once published:

```bash
npm install -g @prism/cli
# or
npx prism --help
```

## Environment

- `PRISM_REGISTRY_URL` – base URL for API calls.
- `PRISM_PUBLISHER_NAME` / `PRISM_PUBLISHER_EMAIL` – optional defaults for `prism publish`.

## Commands

### `prism publish [--dir <path>]`

- Reads `package.json` (and optional `prism.json`) from the working directory.
- Creates a tarball (ignoring `node_modules`, `.git`, `dist`, `.next`, `.turbo`, `build`).
- Computes SHA-256, posts to `/v1/packages/:manifest.name` with `source="cli"`.
- Validates the manifest name matches the CLI path to avoid namespace squatting.
- Output: `Published <name>@<version>` upon success.

Example:

```bash
PRISM_REGISTRY_URL=http://localhost:4000 \
  PRISM_PUBLISHER_NAME="Registry Bot" \
  prism publish
```

### `prism info <name>`

- GET `/v1/packages/:name` → prints latest version, version list, and tags.

```
$ prism info @acme/widget
Package: @acme/widget
Latest:  2.4.1
Versions: 1.0.0, 1.1.0, 2.0.0, 2.4.1
Tags:     typed, zero-deps
```

### `prism resolve <spec> --runtime <node|deno|bun>`

- GET `/v1/resolve?spec=...` → prints URL, entry path, runtime, format, optional types URL.
- Useful for verifying manifest correctness without publishing to npm.

```
$ prism resolve @acme/widget@^2.0.0 --runtime=bun
Spec:     @acme/widget@^2.0.0
Runtime:  bun
Format:   esm
URL:      https://registry.example.com/packages/@acme/widget/2.4.1/dist/bun.js
Entry:    dist/bun.js
Types:    https://registry.example.com/packages/@acme/widget/2.4.1/dist/index.d.ts
```

## Extensibility

- Additional subcommands can be added under `src/commands/` and registered in `src/index.ts`.
- The HTTP helper currently uses global `fetch`; swap for `undici` or signed requests if auth is required.
- `prism.json` is intentionally lightweight (publisher overrides today; future ideas: channel tags, custom ignore lists).
