/**
 * PrismArtifact describes the immutable tarball produced for a specific version.
 * It is storage-agnostic and only includes logical properties.
 */
export interface PrismArtifact {
  // Fully qualified content hash (e.g. sha512-... base64)
  integrity: string
  // Size of the tarball in bytes
  size: number
  // Path inside registry for retrieval (logical key, not physical URL)
  key: string
  // Optional CDN-optimized filename suggestion
  filename?: string
}

export interface ArtifactIndexEntry {
  name: string
  version: string
  artifact: PrismArtifact
}

// TODO(storage): Map artifact.key to actual storage location/driver.
// TODO(perf): Consider content-addressable storage and deduplication.
