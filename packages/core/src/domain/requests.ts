import type { PrismManifest } from '../manifest'
import type { PrismRuntime } from '../manifest'
import type { PrismArtifact } from './artifact'

export interface PublishRequest {
  // Raw upload info
  filename: string
  size: number
  contentType?: string
  // Uploaded bytes (optional for streaming implementations)
  bytes?: Uint8Array
}

export interface PublishResult {
  name: string
  version: string
  artifact: PrismArtifact
  manifest: PrismManifest
  createdAt: string
  tags: string[]
}

export interface ResolveRequest {
  spec: string // e.g. "react@^18" or "@scope/pkg@1.2.3"
  runtime: PrismRuntime
  baseUrl?: string
}

export interface ResolveResult {
  url: string
  runtime: PrismRuntime
  format: 'esm' | 'cjs' | 'bundle'
  entryPath: string
  typesUrl?: string
  manifest: PrismManifest
}
