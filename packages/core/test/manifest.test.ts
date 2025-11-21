/// <reference types="vitest" />
import { describe, expect, it } from 'vitest'
import { isValidPrismManifest, type PrismManifest } from '../src/manifest'

const buildManifest = (
  overrides: Partial<PrismManifest> = {},
): PrismManifest => ({
  name: 'pkg-demo',
  version: '1.2.3',
  files: ['index.js', 'package.json'],
  integrity: 'sha512-demo',
  metadata: { description: 'demo' },
  ...overrides,
})

describe('isValidPrismManifest', () => {
  it('returns true for a valid manifest', () => {
    expect(isValidPrismManifest(buildManifest())).toBe(true)
  })

  it('rejects manifests missing core fields', () => {
    expect(isValidPrismManifest({ ...buildManifest(), name: '' })).toBe(false)
    expect(isValidPrismManifest({ ...buildManifest(), version: '' })).toBe(
      false,
    )
    expect(
      isValidPrismManifest({
        ...buildManifest(),
        files: ['index.js', 42 as any],
      }),
    ).toBe(false)
    expect(isValidPrismManifest({ ...buildManifest(), integrity: '' })).toBe(
      false,
    )
  })

  it('validates exports, runtimes, and metadata shape', () => {
    expect(
      isValidPrismManifest({
        ...buildManifest(),
        exports: { '.': './index.js' },
        runtimes: { node: true, deno: false },
      }),
    ).toBe(true)

    expect(
      isValidPrismManifest({
        ...buildManifest(),
        exports: { '.': 42 as any },
      }),
    ).toBe(false)

    expect(
      isValidPrismManifest({
        ...buildManifest(),
        runtimes: { node: 'yes' as any },
      }),
    ).toBe(false)

    expect(
      isValidPrismManifest({
        ...buildManifest(),
        metadata: ['not-object'] as any,
      }),
    ).toBe(false)
  })
})
