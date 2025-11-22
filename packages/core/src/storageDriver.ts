export interface StorageDriver {
  putTarball(pkg: string, version: string, buffer: Buffer | Uint8Array): Promise<void>
  getTarball(pkg: string, version: string): Promise<Buffer | null>
  putMetadata(pkg: string, version: string, metadata: unknown): Promise<void>
  getMetadata(pkg: string, version: string): Promise<unknown | null>
  listVersions(pkg: string): Promise<string[]>
}

type SemverTuple = [number, number, number]

export function compareSemver(a: string, b: string): number {
  const parsedA = parseSemver(a)
  const parsedB = parseSemver(b)
  if (parsedA && parsedB) {
    for (let i = 0; i < 3; i += 1) {
      if (parsedA[i] !== parsedB[i]) {
        return parsedA[i] - parsedB[i]
      }
    }
    return 0
  }
  return a.localeCompare(b, 'en', { numeric: true })
}

function parseSemver(value: string): SemverTuple | null {
  const parts = value.split('.')
  if (parts.length !== 3) return null
  const nums = parts.map((p) => Number(p))
  if (nums.some((n) => Number.isNaN(n))) return null
  return nums as SemverTuple
}

export class InMemoryStorageDriver implements StorageDriver {
  private readonly tarballs = new Map<string, Map<string, Buffer>>()
  private readonly metadata = new Map<string, Map<string, unknown>>()

  private ensurePkg(map: Map<string, Map<string, any>>, pkg: string) {
    let versions = map.get(pkg)
    if (!versions) {
      versions = new Map<string, any>()
      map.set(pkg, versions)
    }
    return versions
  }

  async putTarball(pkg: string, version: string, buffer: Buffer | Uint8Array): Promise<void> {
    const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer)
    const versions = this.ensurePkg(this.tarballs as unknown as Map<string, Map<string, Buffer>>, pkg)
    versions.set(version, buf)
  }

  async getTarball(pkg: string, version: string): Promise<Buffer | null> {
    const versions = this.tarballs.get(pkg)
    return versions?.get(version) ?? null
  }

  async putMetadata(pkg: string, version: string, metadata: unknown): Promise<void> {
    const versions = this.ensurePkg(this.metadata as unknown as Map<string, Map<string, unknown>>, pkg)
    // Store a deep copy via JSON if serializable, else store as-is
    try {
      const json = JSON.stringify(metadata)
      versions.set(version, JSON.parse(json))
    } catch {
      versions.set(version, metadata)
    }
  }

  async getMetadata(pkg: string, version: string): Promise<unknown | null> {
    const versions = this.metadata.get(pkg)
    return versions?.get(version) ?? null
  }

  async listVersions(pkg: string): Promise<string[]> {
    const meta = this.metadata.get(pkg)
    const tar = this.tarballs.get(pkg)
    const set = new Set<string>()
    meta?.forEach((_, v) => set.add(v))
    tar?.forEach((_, v) => set.add(v))
    return Array.from(set).sort(compareSemver)
  }
}
