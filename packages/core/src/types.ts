import type { PrismManifest, PrismRuntime } from './manifest'

export interface PrismSpec {
  name: string
  range?: string
  runtime: PrismRuntime
}

export type ResolvedEntryFormat = 'esm' | 'cjs' | 'bundle'

export interface ResolvedEntry {
  url: string
  format: ResolvedEntryFormat
  typesUrl?: string
  manifest: PrismManifest
}
