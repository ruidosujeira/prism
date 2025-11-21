# Dashboard (apps/dashboard)

The dashboard is a Vite + React Router SPA intended for internal operators. It consumes the `/v1` API surface and displays runtime, export, and provenance data per package/version.

## Running Locally

```bash
cd apps/dashboard
pnpm install   # root install already handles this
VITE_PRISM_API_URL=http://localhost:4000 pnpm dev
```

The dev server (default port `4173`) proxies API calls directly to the configured backend URL.

## Pages

1. **Packages** – grid of all packages returned by `/v1/packages`. Shows latest version and analyzer tags.
2. **Package Detail** – `/packages/:name`. Displays tags and a version gallery (latest badge, links to version view).
3. **Version Detail** – `/packages/:name/:version`. Sections include:
   - Runtime badges from analyzer compatibility signals.
   - Manifest summary (integrity, tracked files, types entry).
   - Exports table for quick inspection of entry points.
   - Runtime resolution cards (per runtime, calling `/v1/resolve`).
   - Distribution stats (file count, raw/gzip sizes) and provenance (checksum, maturity, cadence, artifact link).

## API Client

`src/api/client.ts` centralizes fetch helpers and shared types. It respects `VITE_PRISM_API_URL` and exposes `fetchPackages`, `fetchPackage`, `fetchPackageVersion`, and `fetchResolution`.

## Styling & UX

- Minimal CSS (`src/main.css`) focusing on dark-mode grids that highlight analyzer tags.
- Layout component (`components/Layout.tsx`) provides consistent header/nav and links to repo docs.
- React Router handles navigation; no state management library is required yet.

## Production Build

```
pnpm --filter prism-dashboard build
```

Produces a static bundle in `apps/dashboard/dist`. Deploy behind any CDN or reverse proxy (set `VITE_PRISM_API_URL` at build time or inject via environment replacement).
