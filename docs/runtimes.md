# Runtimes

Prism understands three runtimes today: **Node.js**, **Deno**, and **Bun**. All live under the `PrismRuntime` union in `@prism/core` and share a configuration block:

```ts
const RUNTIME_CONFIG = {
  node: {
    defaultEntries: [
      'index.js',
      'index.mjs',
      'index.ts',
      'main.js',
      'main.mjs',
    ],
  },
  deno: { defaultEntries: ['mod.ts', 'main.ts', 'index.ts', 'mod.mjs'] },
  bun: { defaultEntries: ['index.ts', 'index.js', 'bun.ts', 'bun.js'] },
}
```

## Resolution Order

1. Look for explicit export keys matching the runtime (`"node"`, `"deno"`, `"bun"`).
2. Fall back to common keys (`"."`, `"default"`).
3. Use `defaultEntries` for the runtime and ensure the file exists according to the manifest file list.
4. Throw `EntryPointResolutionError` if nothing matches.

## Manifest Expectations

- Keep `exports` flat (string targets). Conditional exports are supported by extracting `.default`/`.import` fields during ingestion.
- The CLI/dashboard highlight missing runtime exports so package authors can iterate quickly.

## Extending Runtimes

To add another runtime (e.g., `edge`):

1. Update `PrismRuntime` and `RUNTIME_CONFIG` in `@prism/core`.
2. Teach analyzers to capture compatibility flags for the new runtime.
3. Update CLI/dashboard to expose the new runtime (options, cards, badges).
4. Consider storage/manifest migrations if additional metadata is needed.

## Analyzer Tags

- `runtime-node`, `runtime-deno`, `runtime-bun` (future) can be derived from compatibility flags.
- Tags surface on `/v1/packages` and the dashboard to communicate readiness for each runtime.
