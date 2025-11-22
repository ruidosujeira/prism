import type { StorageDriver } from '@prism/core'
import { compareSemver } from '@prism/core'

// Stub S3 driver that satisfies the StorageDriver interface without
// performing any network operations. Useful for tests/integration wiring.
export class S3StubStorageDriver implements StorageDriver {
  private readonly tarballs = new Map<string, Map<string, Buffer>>()
  private readonly metadata = new Map<string, Map<string, unknown>>()

  private ensure(map: Map<string, Map<string, any>>, key: string) {
    let inner = map.get(key)
    if (!inner) {
      inner = new Map<string, any>()
      map.set(key, inner)
    }
    return inner
  }

  async putTarball(pkg: string, version: string, buffer: Buffer | Uint8Array): Promise<void> {
    const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer)
    const versions = this.ensure(this.tarballs as unknown as Map<string, Map<string, Buffer>>, pkg)
    versions.set(version, buf)
  }

  async getTarball(pkg: string, version: string): Promise<Buffer | null> {
    return this.tarballs.get(pkg)?.get(version) ?? null
  }

  async putMetadata(pkg: string, version: string, metadata: unknown): Promise<void> {
    const versions = this.ensure(this.metadata as unknown as Map<string, Map<string, unknown>>, pkg)
    try {
      const json = JSON.stringify(metadata)
      versions.set(version, JSON.parse(json))
    } catch {
      versions.set(version, metadata)
    }
  }

  async getMetadata(pkg: string, version: string): Promise<unknown | null> {
    return this.metadata.get(pkg)?.get(version) ?? null
  }

  async listVersions(pkg: string): Promise<string[]> {
    const set = new Set<string>()
    this.metadata.get(pkg)?.forEach((_, v) => set.add(v))
    this.tarballs.get(pkg)?.forEach((_, v) => set.add(v))
    return Array.from(set).sort(compareSemver)
  }
}
