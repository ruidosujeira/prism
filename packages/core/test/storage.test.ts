/// <reference types="vitest" />
import { beforeEach, describe, expect, it } from 'vitest'
import { InMemoryPrismStorage, type PrismManifest } from '../src'

let storage: InMemoryPrismStorage

const createManifest = (version: string): PrismManifest => ({
  name: 'pkg-alpha',
  version,
  files: ['index.js'],
  integrity: 'sha512-demo',
})

beforeEach(() => {
  storage = new InMemoryPrismStorage()
})

describe('InMemoryPrismStorage', () => {
  it('stores and retrieves manifests', async () => {
    const manifest = createManifest('1.0.0')
    await storage.putManifest(manifest)

    const loaded = await storage.getManifest(manifest.name, manifest.version)
    expect(loaded).toEqual(manifest)
  })

  it('returns the latest manifest based on semver ordering', async () => {
    await storage.putManifest(createManifest('1.0.0'))
    await storage.putManifest(createManifest('1.5.0'))
    await storage.putManifest(createManifest('1.12.0'))

    const latest = await storage.getLatestManifest('pkg-alpha')
    expect(latest?.version).toBe('1.12.0')
  })

  it('lists versions in ascending semver order', async () => {
    await storage.putManifest(createManifest('2.0.0'))
    await storage.putManifest(createManifest('1.0.0'))
    await storage.putManifest(createManifest('1.0.1'))

    const versions = await storage.listVersions('pkg-alpha')
    expect(versions).toEqual(['1.0.0', '1.0.1', '2.0.0'])
  })
})
