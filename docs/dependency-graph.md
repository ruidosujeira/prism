### Prism Workspace Dependency Graph

Legend
- Solid arrow (A -> B): A depends on B at build/runtime.
- Dashed arrow: dev/test-only dependency.

Packages
- @prism/shared
- @prism/core
- prism-registry-backend
- @prism/cli
- prism-registry-web
- apps/dashboard
- @prism/storage-s3

Graph (high level)

@prism/core -> @prism/shared
@prism/storage-s3 -> @prism/core -> @prism/shared
prism-registry-backend -> @prism/core -> @prism/shared
prism-registry-backend -> @prism/storage-s3 (optional, prod)
@prism/cli -> @prism/shared
@prism/cli -> backend HTTP APIs (runtime, not a package import)
prism-registry-web -> backend HTTP APIs (runtime)
apps/dashboard -> backend HTTP APIs (runtime)

Notes
- The resolver lives in @prism/core and depends only on shared schemas/utilities.
- The backend composes core (resolver, storage interface) and selects a driver at runtime via a storage factory.
- S3 driver implements PrismStorage and can be swapped without touching backend logic beyond configuration.
- UI apps and CLI consume the backend over HTTP and should not import backend internals directly.
