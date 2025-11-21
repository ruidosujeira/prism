/// <reference types="vitest" />
import { describe, expect, it } from 'vitest'
import {
  EntryPointResolutionError,
  resolveRuntimeEntry,
  type PrismManifest,
} from '../src'

const manifest = (overrides: Partial<PrismManifest> = {}): PrismManifest => ({
  name: 'runtime-pkg',
  version: '1.0.0',
  files: ['index.js', 'index.ts', 'node.js'],
  integrity: 'sha512-runtime',
  exports: { '.': './index.js' },
  ...overrides,
})

describe('resolveRuntimeEntry', () => {
  it('prefers runtime-specific exports', () => {
    const payload = manifest({
      exports: {
        node: './node.js',
        deno: './index.ts',
      },
    })

    expect(resolveRuntimeEntry(payload, 'node').entryPath).toBe('node.js')
    expect(resolveRuntimeEntry(payload, 'deno').entryPath).toBe('index.ts')
  })

  it('falls back to default export map entries', () => {
    const payload = manifest({
      exports: { '.': './custom/main.mjs' },
      files: ['custom/main.mjs'],
    })

    const result = resolveRuntimeEntry(payload, 'bun')
    expect(result.entryPath).toBe('custom/main.mjs')
    expect(result.format).toBe('esm')
  })

  it('falls back to common entry filenames when exports are missing', () => {
    const payload = manifest({ exports: undefined, files: ['index.mjs'] })
    const result = resolveRuntimeEntry(payload, 'node')
    expect(result.entryPath).toBe('index.mjs')
  })

  it('throws when no entries can be resolved', () => {
    const payload = manifest({ files: ['README.md'], exports: undefined })
    expect(() => resolveRuntimeEntry(payload, 'node')).toThrow(
      EntryPointResolutionError,
    )
  })
})
