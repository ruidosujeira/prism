# Storage

Prism separates **metadata/tarball storage** (always filesystem under `STORAGE_ROOT`) from **manifest storage** (pluggable via the `PrismStorage` interface). This allows local development to keep everything on disk while production can push manifests to an object store or memory-backed cache.

## Drivers

| Driver     | Setting                           | Notes                                                                                                          |
| ---------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| In-memory  | `PRISM_STORAGE_DRIVER=memory`     | Uses `InMemoryPrismStorage`. Ephemeral, best for tests.                                                        |
| Filesystem | `PRISM_STORAGE_DRIVER=filesystem` | Uses `FilesystemPrismStorage`, storing manifests under `STORAGE_ROOT/packages/<name>/<version>/manifest.json`. |
| S3         | `PRISM_STORAGE_DRIVER=s3`         | Uses `@prism/storage-s3` with a bucket/prefix layout (`<prefix>/manifests/<name>/<version>.json`).             |

### S3 Configuration

- `PRISM_S3_BUCKET` – required.
- `PRISM_S3_REGION` – required.
- `PRISM_S3_ENDPOINT` – optional (use for MinIO/R2).
- `PRISM_S3_ACCESS_KEY_ID` / `PRISM_S3_SECRET_ACCESS_KEY` – optional if using instance/role credentials.

`@prism/storage-s3` relies on `@aws-sdk/client-s3` and supports pagination for large version counts. Manifests are validated via `isValidPrismManifest` before returning to callers.

## Storage Factory

`packages/backend/src/storage/storageFactory.ts` centralizes driver selection. The backend lazily instantiates a single storage instance per process:

```ts
const storage = getPrismStorage()
```

Any route/service needing manifests should import `getPrismStorage` instead of the filesystem-specific class.

## Metadata Repository

Even when manifests live elsewhere, metadata and tarballs remain on disk for predictable ingestion:

```
STORAGE_ROOT/
└─ packages/
   └─ <name>/
      └─ <version>/
         ├─ metadata.json
         ├─ package.tgz
         └─ manifest.json (if filesystem driver)
```

The dashboard and CLI read `/v1/packages/:name/:version` which always combines metadata + manifest regardless of driver.
