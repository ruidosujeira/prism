# Resolver

The resolver lives in `@prism/core` (`src/resolver.ts`) and powers both the backend `/v1/resolve` route and the CLI `prism resolve` command.

## Inputs

- **Spec** – `package` or `package@range`. Supports exact `1.2.3`, caret (`^1.0.0`), and tilde (`~1.2.0`) selectors. Missing version defaults to the latest published.
- **Runtime** – one of `node`, `deno`, `bun`. Determines default entries and export preference order.
- **Base URL** – optional absolute origin. If omitted, the backend infers it from `PRISM_PUBLIC_BASE_URL` or the incoming request host. Returned URLs always include `/packages/:name/:version/:path`.
- **Storage** – any `PrismStorage` implementation (in-memory, filesystem, S3) that can list versions and fetch manifests.

## Algorithm

1. **Parse spec** → `{ name, range }` (handles scoped packages).
2. **Select version** → uses `storage.listVersions(name)` plus `pickVersionForRange`. Versions must be sorted ascending.
3. **Load manifest** → `storage.getManifest(name, version)`; throws `VersionNotFoundError` if missing.
4. **Resolve runtime entry**:
   - Normalize manifest `exports` into `{ key: string }` map.
   - Preferred keys: `[runtime, '.', 'default']`.
   - Fallback to runtime-specific default files (`RUNTIME_CONFIG.defaultEntries`).
   - Detect format based on extension (`.mjs`/`.ts` → `esm`, `.cjs`/`.js` → `cjs`, else `bundle`).
5. **Assemble response** → `{ url, entryPath, format, runtime, typesUrl?, manifest }`.

## Errors

- `PackageNotFoundError` – storage has no versions for the package.
- `VersionNotFoundError` – range resolution fails or manifest retrieval fails.
- `EntryPointResolutionError` – no matching export/default file for the selected runtime.

## Extensibility

- Add new runtimes by extending `PrismRuntime`, updating `RUNTIME_CONFIG`, and ensuring manifests contain the appropriate export keys.
- Storage is pluggable; implement `PrismStorage` and register it in the backend storage factory.
- Frontends should treat URLs as opaque – the backend may include signatures or CDN hosts later.
