import type { PrismManifest, PrismRuntime } from './manifest'

export interface PrismRuntimeConfig {
  runtime: PrismRuntime
  defaultEntries: string[]
}

export interface PrismSpec {
  name: string
  range?: string
  runtime: PrismRuntime
  baseUrl?: string
}

export type ResolvedEntryFormat = 'esm' | 'cjs' | 'bundle'

export interface RuntimeResolution {
  entryPath: string
  format: ResolvedEntryFormat
}

export interface ResolvedEntry extends RuntimeResolution {
  url: string
  runtime: PrismRuntime
  typesUrl?: string
  manifest: PrismManifest
}
