import type { PrismManifest } from '../manifest'
import type { PrismArtifact } from './artifact'

export type PrismTag = 'latest' | string

export interface PrismVersionMeta {
  name: string
  version: string
  createdAt: string // ISO8601
  dist: PrismArtifact
  manifest: PrismManifest
  // denormalized helpers
  filesCount: number
}

export interface PrismPackageIndex {
  name: string
  versions: string[]
  tags: Record<PrismTag, string | undefined>
}

export interface PrismPackageSummary {
  name: string
  description?: string
  homepage?: string
  keywords?: string[]
  latestVersion?: string
}

export interface PrismPackage {
  index: PrismPackageIndex
  byVersion: Record<string, PrismVersionMeta>
}

// TODO(storage): Persist index and per-version metadata efficiently.
// TODO(perf): Consider write-optimized indices vs query-optimized materializations.
