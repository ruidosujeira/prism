/// <reference types="vitest" />
import { beforeEach, describe, expect, it } from 'vitest'
import {
  EntryPointResolutionError,
  InMemoryPrismStorage,
  PackageNotFoundError,
  VersionNotFoundError,
  resolveSpec,
  type PrismManifest,
} from '../src'

type Runtime = Parameters<typeof resolveSpec>[1]['runtime']

let storage: InMemoryPrismStorage

const buildManifest = (
  overrides: Partial<PrismManifest> = {},
): PrismManifest => ({
  name: 'demo-pkg',
  version: '1.0.0',
  files: ['index.js'],
  integrity: 'sha512-test',
  exports: { '.': './index.js' },
  ...overrides,
})

const seedManifest = async (manifest: Partial<PrismManifest>) => {
  const payload = buildManifest(manifest)
  await storage.putManifest(payload)
  return payload
}

beforeEach(() => {
  storage = new InMemoryPrismStorage()
})

describe('resolveSpec', () => {
  it('resolves exact versions', async () => {
    const manifest = await seedManifest({ version: '2.3.4' })
    const resolved = await resolveSpec(
      `${manifest.name}@${manifest.version}`,
      { runtime: 'node' },
      storage,
    )

    expect(resolved.entryPath).toBe('index.js')
    expect(resolved.manifest.version).toBe('2.3.4')
  })

  it('resolves caret and tilde ranges', async () => {
    await seedManifest({ version: '1.0.0' })
    await seedManifest({ version: '1.5.0', exports: { '.': './main.mjs' } })
    await seedManifest({ version: '2.0.0' })

    const caret = await resolveSpec(
      'demo-pkg@^1.0.0',
      { runtime: 'node' },
      storage,
    )
    expect(caret.manifest.version).toBe('1.5.0')
    expect(caret.format).toBe('esm')

    const tilde = await resolveSpec(
      'demo-pkg@~1.0.0',
      { runtime: 'node' },
      storage,
    )
    expect(tilde.manifest.version).toBe('1.0.0')
  })

  it('throws when package or version cannot be found', async () => {
    await expect(
      resolveSpec('missing@1.0.0', { runtime: 'node' }, storage),
    ).rejects.toBeInstanceOf(PackageNotFoundError)

    await seedManifest({ version: '1.0.0' })
    await expect(
      resolveSpec('demo-pkg@^2.0.0', { runtime: 'node' }, storage),
    ).rejects.toBeInstanceOf(VersionNotFoundError)
  })

  it('throws when no entry point can be resolved', async () => {
    await seedManifest({
      version: '1.0.1',
      files: ['README.md'],
      exports: undefined,
    })

    await expect(
      resolveSpec('demo-pkg@1.0.1', { runtime: 'node' }, storage),
    ).rejects.toBeInstanceOf(EntryPointResolutionError)
  })

  it('respects runtime-specific exports', async () => {
    await seedManifest({
      version: '1.1.0',
      files: ['node.js', 'deno.ts', 'bun.js'],
      exports: {
        node: './node.js',
        deno: './deno.ts',
        bun: './bun.js',
      },
    })

    const expectations: Record<Runtime, string> = {
      node: 'node.js',
      deno: 'deno.ts',
      bun: 'bun.js',
    }

    for (const runtime of Object.keys(expectations) as Runtime[]) {
      const resolved = await resolveSpec('demo-pkg@1.1.0', { runtime }, storage)
      expect(resolved.entryPath).toBe(expectations[runtime])
    }
  })

  it('returns urls relative to a provided baseUrl', async () => {
    await seedManifest({
      version: '3.0.0',
      files: ['dist/index.cjs', 'dist/types.d.ts'],
      exports: { '.': './dist/index.cjs' },
      types: './dist/types.d.ts',
    })

    const resolved = await resolveSpec(
      'demo-pkg@3.0.0',
      { runtime: 'node', baseUrl: 'https://cdn.example.com' },
      storage,
    )

    expect(resolved.url).toBe(
      'https://cdn.example.com/packages/demo-pkg/3.0.0/dist/index.cjs',
    )
    expect(resolved.typesUrl).toBe(
      'https://cdn.example.com/packages/demo-pkg/3.0.0/dist/types.d.ts',
    )
  })
})
