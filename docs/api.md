# HTTP API

All endpoints live under `/v1`. Requests and responses are JSON unless noted. Authentication/authorization layers are intentionally omitted at this stage so platform teams can add the desired mechanism (mTLS, OAuth, etc.).

## Publish

### `POST /v1/packages/:name`

- **Body** – matches `PublishPayloadSchema` (`packages/shared/src/schemas/publish.ts`).

```json
{
  "tarballBase64": "<base64>",
  "sha256": "d2f...",
  "publisher": { "name": "Jane Ops", "email": "ops@example.com" },
  "source": "cli"
}
```

- **Status 201** – returns `PublishResponseSchema` with the normalized identifier plus metadata echo.
- **Errors** – `400` for schema violations or checksum mismatch, `409` for name mismatch vs. route param.

## Packages

### `GET /v1/packages`

Returns an array of package summaries (`name`, `latest`, `versions[]`, `tags[]`).

### `GET /v1/packages/:name`

Returns the same summary for a single package or `404` if not found.

### `GET /v1/packages/:name/:version`

Returns `{ metadata, manifest }`:

```json
{
  "metadata": {
    "identifier": { "name": "@acme/widget", "version": "2.4.1" },
    "tags": ["typed", "zero-deps"],
    "distribution": { "rawBytes": 8192, "gzipBytes": 2048 },
    "exports": { ".": "dist/index.js", "node": "dist/node.js" },
    "runtime": {
      "compatibility": { "node": "stable", "deno": false, "bun": true },
      "types": "types"
    },
    "release": {
      "publishedAt": "2025-11-21T10:23:11.000Z",
      "maturityScore": 75
    },
    "checksum": "sha256-..."
  },
  "manifest": {
    "name": "@acme/widget",
    "version": "2.4.1",
    "files": ["package.json", "dist/index.js"],
    "integrity": "sha512-...",
    "exports": { ".": "dist/index.js" }
  }
}
```

### `GET /v1/packages/:name/:version/files`

Returns the `FileTreeSnapshot` captured during ingestion. Useful for diff views.

### `GET /v1/packages/:name/:version/diff/:previous`

Runs the diff analyzer between `version` and `previous`. Shape matches `DiffSchema` in `@prism/shared`.

## Resolver

### `GET /v1/resolve`

Query params:

- `spec` – package spec (`name` or `name@range`). Required.
- `runtime` – `node`, `deno`, `bun`. Defaults to `node`.
- `baseUrl` – optional absolute URL to override automatic host inference.

Response shape (`ResolvedEntry` from `@prism/core`):

```json
{
  "url": "https://registry.example.com/packages/@acme/widget/2.4.1/dist/index.js",
  "entryPath": "dist/index.js",
  "runtime": "node",
  "format": "esm",
  "typesUrl": "https://registry.example.com/packages/@acme/widget/2.4.1/dist/index.d.ts",
  "manifest": { ... PrismManifest ... }
}
```

Errors use `404` for missing packages/versions/entries and `400` for malformed specs.

## Versioning

- All endpoints are versioned under `/v1` to allow future breaking changes.
- Schema additions are backwards-compatible; clients should tolerate extra fields by default.

## Tooling

- OpenAPI descriptions can be generated from `@prism/shared` schemas (future milestone in `docs/roadmap.md`).
- SDKs (CLI, dashboard) rely directly on these endpoints to guarantee parity.
