# Roadmap

This roadmap balances immediate platform needs with aspirational initiatives. Dates are intentionally relative; prioritize based on customer demand.

## Q1 FY26 – Operational Hardening

- **AuthN/AuthZ** – pluggable auth middleware (mTLS, PATs, OIDC) plus scoped publish tokens.
- **Search API** – expose `/v1/search` backed by `searchIndexService` (ranking + pagination).
- **Structured logging** – Pino transports to Datadog/Grafana with request IDs plumbed through CLI/dashboard.
- **Integration smoke tests** – scripted publish + resolve flow executed in CI on every merge.

## Q2 FY26 – Supply Chain Guarantees

- **Sigstore integration** – emit and verify bundle per manifest, attach to provenance payloads.
- **SBOM export** – optional CycloneDX file per publish (toggle via `prism.json`).
- **Async analyzers** – offload AST/static analysis to a queue while keeping synchronous checks slim.
- **Resolver CDN** – edge worker that implements `resolveSpec` close to consumers (still backed by Prism storage).

## Q3 FY26 – Ecosystem Expansion

- **Package insights** – expose metrics (download deltas, runtime adoption) in dashboard + API.
- **Team/Channel model** – namespace packages by team with ACLs; extend CLI to target channels.
- **Webhooks** – notify CI/CD or chat tools on publish, resolve spikes, or analyzer regressions.

## Ideas (Backlog)

- Git-based storage driver for air-gapped installs.
- WASM sandbox for deterministic analyzer plug-ins.
- Polyrepo adapters (automatic mirroring from npm to Prism with policies).

Contributions welcome—open issues/PRs referencing this roadmap so we can track progress.
