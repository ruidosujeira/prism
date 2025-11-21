# Prism Registry

Prism is a premium JavaScript package registry prioritizing determinism, transparency, and tasteful engineering. This monorepo houses the backend ingestion API, shared schemas/utilities, and the optional web explorer.

## Structure

```
prism/
  packages/
    backend/   # Registry API + analyzers + storage
    shared/    # Contracts, schemas, utilities
    web/       # Next.js UI (optional)
  infra/
    docker/    # Deployment assets
    scripts/   # Operational helpers
```

## Getting Started

```sh
pnpm install
pnpm dev
```

- `pnpm dev` runs backend and web workspaces concurrently.
- Use `pnpm --filter prism-registry-backend dev` or `pnpm --filter prism-registry-web dev` for focused development.

## Principles

- Clarity over cleverness
- Minimalism over complexity
- Deterministic analysis
- Strong typing everywhere
- No AI/ML logic inside the registry
