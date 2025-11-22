import {
  EntryPointResolutionError,
  PackageNotFoundError,
  PrismError,
  VersionNotFoundError,
} from './errors'
import type { PrismManifest, PrismRuntime } from './manifest'
import type { PrismStorage } from './storage'
import type {
  PrismRuntimeConfig,
  PrismSpec,
  ResolvedEntry,
  RuntimeResolution,
} from './types'
import { normalizeExportsRecord } from '@prism/shared'

export interface ResolveContext {
  runtime: PrismRuntime
  baseUrl?: string
}

type ParsedSpec = { name: string; range?: string }
type SemverTuple = [number, number, number]
type RangeDescriptor =
  | { kind: 'exact'; target: SemverTuple }
  | { kind: '^' | '~'; target: SemverTuple }

export async function resolveSpec(
  spec: string,
  ctx: ResolveContext,
  storage: PrismStorage,
): Promise<ResolvedEntry> {
  const parsedSpec = parseSpec(spec)
  const prismSpec: PrismSpec = {
    name: parsedSpec.name,
    range: parsedSpec.range,
    runtime: ctx.runtime,
    baseUrl: ctx.baseUrl,
  }

  const availableVersions = await storage.listVersions(prismSpec.name)
  if (!availableVersions.length) {
    throw new PackageNotFoundError(prismSpec.name)
  }

  const selectedVersion = prismSpec.range
    ? pickVersionForRange(availableVersions, prismSpec.range)
    : availableVersions[availableVersions.length - 1]

  if (!selectedVersion) {
    throw new VersionNotFoundError(prismSpec.name, prismSpec.range ?? 'latest')
  }

  const manifest = await storage.getManifest(prismSpec.name, selectedVersion)
  if (!manifest) {
    throw new VersionNotFoundError(prismSpec.name, selectedVersion)
  }

  const { entryPath, format } = resolveRuntimeEntry(manifest, prismSpec.runtime)
  const normalizedEntry = normalizePath(entryPath)
  const url = buildUrl(
    prismSpec.name,
    manifest.version,
    normalizedEntry,
    prismSpec.baseUrl,
  )
  const typesUrl = manifest.types
    ? buildUrl(
        prismSpec.name,
        manifest.version,
        normalizePath(manifest.types),
        prismSpec.baseUrl,
      )
    : undefined

  return {
    url,
    entryPath: normalizedEntry,
    runtime: prismSpec.runtime,
    format,
    typesUrl,
    manifest,
  }
}

function parseSpec(spec: string): ParsedSpec {
  const trimmed = spec.trim()
  if (!trimmed) {
    throw new PrismError('Package spec cannot be empty.')
  }

  if (trimmed.startsWith('@')) {
    const at = trimmed.indexOf('@', 1)
    if (at === -1) {
      return { name: trimmed }
    }
    const name = trimmed.slice(0, at)
    const range = trimmed.slice(at + 1) || undefined
    return { name, range }
  }

  const at = trimmed.indexOf('@')
  if (at === -1) {
    return { name: trimmed }
  }

  const name = trimmed.slice(0, at)
  const range = trimmed.slice(at + 1) || undefined
  return { name, range }
}

function pickVersionForRange(
  versions: string[],
  range: string,
): string | undefined {
  const descriptor = parseRange(range)
  if (!descriptor) {
    return versions[versions.length - 1]
  }
  for (let i = versions.length - 1; i >= 0; i -= 1) {
    if (satisfiesRange(versions[i], descriptor)) {
      return versions[i]
    }
  }
  return undefined
}

function parseRange(range: string): RangeDescriptor | null {
  const trimmed = range.trim()
  if (!trimmed) {
    return null
  }
  let kind: RangeDescriptor['kind'] = 'exact'
  let version = trimmed
  if (trimmed.startsWith('^')) {
    kind = '^'
    version = trimmed.slice(1)
  } else if (trimmed.startsWith('~')) {
    kind = '~'
    version = trimmed.slice(1)
  }
  const tuple = parseSemverTuple(version)
  return tuple ? { kind, target: tuple } : null
}

function satisfiesRange(version: string, descriptor: RangeDescriptor): boolean {
  const tuple = parseSemverTuple(version)
  if (!tuple) {
    return false
  }
  const cmp = compareSemverTuple(tuple, descriptor.target)
  switch (descriptor.kind) {
    case 'exact':
      return cmp === 0
    case '^':
      return tuple[0] === descriptor.target[0] && cmp >= 0
    case '~':
      return (
        tuple[0] === descriptor.target[0] &&
        tuple[1] === descriptor.target[1] &&
        cmp >= 0
      )
    default:
      return false
  }
}

const RUNTIME_CONFIG: Record<PrismRuntime, PrismRuntimeConfig> = {
  node: {
    runtime: 'node',
    defaultEntries: [
      'index.js',
      'index.mjs',
      'index.ts',
      'main.js',
      'main.mjs',
    ],
  },
  deno: {
    runtime: 'deno',
    defaultEntries: ['mod.ts', 'main.ts', 'index.ts', 'mod.mjs'],
  },
  bun: {
    runtime: 'bun',
    defaultEntries: ['index.ts', 'index.js', 'bun.ts', 'bun.js'],
  },
}

export function resolveRuntimeEntry(
  manifest: PrismManifest,
  runtime: PrismRuntime,
): RuntimeResolution {
  const normalizedExports = normalizeExportsRecord(manifest.exports)
  const preferredKeys = [runtime, '.', 'default']

  for (const key of preferredKeys) {
    const candidate = normalizedExports[key]
    if (candidate) {
      return {
        entryPath: candidate,
        format: detectFormat(candidate),
      }
    }
  }

  const fileSet = new Set(manifest.files.map((file) => normalizePath(file)))
  for (const fallback of RUNTIME_CONFIG[runtime].defaultEntries) {
    if (fileSet.has(fallback)) {
      return {
        entryPath: fallback,
        format: detectFormat(fallback),
      }
    }
  }

  throw new EntryPointResolutionError(manifest.name, manifest.version)
}

// normalized via @prism/shared

function detectFormat(path: string) {
  const lower = path.toLowerCase()
  if (lower.endsWith('.mjs') || lower.endsWith('.ts')) {
    return 'esm'
  }
  if (lower.endsWith('.cjs') || lower.endsWith('.js')) {
    return 'cjs'
  }
  return 'bundle'
}

function normalizePath(path: string): string {
  return path.replace(/^\.\//, '').replace(/^\//, '')
}

function buildUrl(
  name: string,
  version: string,
  path: string,
  baseUrl?: string,
): string {
  const relative = `/packages/${name}/${version}/${path}`
  if (!baseUrl) {
    return relative
  }
  const trimmedBase = baseUrl.replace(/\/+$/, '')
  return `${trimmedBase}${relative}`
}

function parseSemverTuple(value: string): SemverTuple | null {
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

function compareSemverTuple(a: SemverTuple, b: SemverTuple): number {
  for (let i = 0; i < 3; i += 1) {
    if (a[i] !== b[i]) {
      return a[i] - b[i]
    }
  }
  return 0
}
