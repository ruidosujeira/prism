import type { PrismManifest } from './manifest'

export interface PrismStorage {
  putManifest(manifest: PrismManifest): Promise<void>
  getManifest(name: string, version: string): Promise<PrismManifest | null>
  getLatestManifest(name: string): Promise<PrismManifest | null>
  listVersions(name: string): Promise<string[]>
}

export class InMemoryPrismStorage implements PrismStorage {
  private readonly packages = new Map<string, Map<string, PrismManifest>>()

  async putManifest(manifest: PrismManifest): Promise<void> {
    const versions =
      this.packages.get(manifest.name) ?? new Map<string, PrismManifest>()
    versions.set(manifest.version, manifest)
    this.packages.set(manifest.name, versions)
  }

  async getManifest(
    name: string,
    version: string,
  ): Promise<PrismManifest | null> {
    const versions = this.packages.get(name)
    return versions?.get(version) ?? null
  }

  async getLatestManifest(name: string): Promise<PrismManifest | null> {
    const versions = this.packages.get(name)
    if (!versions || versions.size === 0) {
      return null
    }
    const sorted = Array.from(versions.keys()).sort(compareSemver)
    return versions.get(sorted[sorted.length - 1]) ?? null
  }

  async listVersions(name: string): Promise<string[]> {
    const versions = this.packages.get(name)
    if (!versions) {
      return []
    }
    return Array.from(versions.keys()).sort(compareSemver)
  }
}

type SemverTuple = [number, number, number]

function compareSemver(a: string, b: string): number {
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
  if (parts.length !== 3) {
    return null
  }
  const numbers = parts.map((part) => Number(part))
  if (numbers.some((part) => Number.isNaN(part))) {
    return null
  }
  return numbers as SemverTuple
}
