export type Runtime = 'node' | 'deno' | 'bun'

export interface PackageSummary {
  name: string
  latest: string
  versions: string[]
  tags: string[]
}

export interface VersionIdentifier {
  name: string
  version: string
}

export interface VersionMetadata {
  identifier: VersionIdentifier
  description?: string
  keywords?: string[]
  license?: string
  repository?: { type?: string; url?: string; directory?: string }
  homepage?: string
  author?: { name?: string; email?: string }
  bugs?: { url?: string; email?: string }
  checksum: string
  dist: {
    tarball: string
    integrity: string
    fileName: string
  }
  files?: {
    generatedAt: string
    totalFiles: number
    totalDirectories: number
  }
  distribution: {
    rawBytes: number
    gzipBytes: number
  }
  runtime: {
    compatibility: Partial<Record<Runtime, string | boolean>>
    types: 'bundle' | 'types' | 'none'
    tags: string[]
  }
  exports?: Record<string, string>
  tags: string[]
  release: {
    publishedAt: string
    maturityScore: number
    previousVersion?: string
    releaseFrequencyDays?: number
  }
}

export interface PrismManifest {
  name: string
  version: string
  files: string[]
  integrity: string
  types?: string
  exports?: Record<string, string>
  runtimes?: Partial<Record<Runtime, boolean>>
  metadata?: Record<string, unknown>
}

export interface PackageVersionResponse {
  metadata: VersionMetadata
  manifest: PrismManifest | null
}

export interface ResolvedEntry {
  url: string
  entryPath: string
  runtime: Runtime
  format: string
  typesUrl?: string
}

export const API_BASE =
  (import.meta.env.VITE_PRISM_API_URL as string | undefined)?.trim() ||
  'http://localhost:4000'

const buildUrl = (path: string) => new URL(path, API_BASE).toString()

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(buildUrl(path), init)
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `Request failed with ${response.status}`)
  }
  return (await response.json()) as T
}

export const fetchPackages = () => request<PackageSummary[]>('/v1/packages')

export const fetchPackage = (name: string) =>
  request<PackageSummary>(`/v1/packages/${encodeURIComponent(name)}`)

export const fetchPackageVersion = (name: string, version: string) =>
  request<PackageVersionResponse>(
    `/v1/packages/${encodeURIComponent(name)}/${encodeURIComponent(version)}`,
  )

export const fetchResolution = (spec: string, runtime: Runtime) => {
  const url = new URL('/v1/resolve', API_BASE)
  url.searchParams.set('spec', spec)
  url.searchParams.set('runtime', runtime)
  return request<ResolvedEntry>(url.toString())
}
