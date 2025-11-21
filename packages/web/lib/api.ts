import type {
  FileTreeSnapshot,
  PackageIndexEntry,
  VersionDiff,
  VersionMetadata,
} from '@prism/shared'

const API_BASE_URL =
  process.env.NEXT_PUBLIC_REGISTRY_API ?? 'http://localhost:4000'

const fetchJson = async <T>(path: string): Promise<T | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      cache: 'no-store',
      headers: { 'prism-client': 'web' },
    })
    if (!response.ok) return null
    return (await response.json()) as T
  } catch (error) {
    console.error('Registry request failed', error)
    return null
  }
}

export const getPackageSummary = (name: string) =>
  fetchJson<PackageIndexEntry>(`/package/${encodeURIComponent(name)}`)

export const getVersionMetadata = (name: string, version: string) =>
  fetchJson<VersionMetadata>(
    `/package/${encodeURIComponent(name)}/${encodeURIComponent(version)}`,
  )

export const getFileTree = (name: string, version: string) =>
  fetchJson<FileTreeSnapshot>(
    `/package/${encodeURIComponent(name)}/${encodeURIComponent(version)}/files`,
  )

export const getDiff = (name: string, version: string, previous: string) =>
  fetchJson<VersionDiff>(
    `/package/${encodeURIComponent(name)}/${encodeURIComponent(
      version,
    )}/diff/${encodeURIComponent(previous)}`,
  )
