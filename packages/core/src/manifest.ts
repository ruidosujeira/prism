export type PrismRuntime = 'node' | 'deno' | 'bun'

export interface PrismManifest {
  name: string
  version: string
  files: string[]
  integrity: string
  types?: string
  exports?: Record<string, string>
  runtimes?: Partial<Record<PrismRuntime, boolean>>
  metadata?: Record<string, unknown>
}

export function isValidPrismManifest(value: unknown): value is PrismManifest {
  if (!value || typeof value !== 'object') {
    return false
  }

  const manifest = value as Record<string, unknown>

  if (!isNonEmptyString(manifest.name) || !isNonEmptyString(manifest.version)) {
    return false
  }

  if (
    !Array.isArray(manifest.files) ||
    manifest.files.some((entry) => typeof entry !== 'string')
  ) {
    return false
  }

  if (!isNonEmptyString(manifest.integrity)) {
    return false
  }

  if (manifest.types !== undefined && typeof manifest.types !== 'string') {
    return false
  }

  if (!isOptionalRecordOfStrings(manifest.exports)) {
    return false
  }

  if (!isOptionalRuntimeRecord(manifest.runtimes)) {
    return false
  }

  if (!isOptionalPlainRecord(manifest.metadata)) {
    return false
  }

  return true
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isOptionalRecordOfStrings(value: unknown): boolean {
  if (value === undefined) {
    return true
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false
  }
  return Object.values(value as Record<string, unknown>).every(
    (entry) => typeof entry === 'string',
  )
}

function isOptionalRuntimeRecord(value: unknown): boolean {
  if (value === undefined) {
    return true
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false
  }
  return Object.values(value as Record<string, unknown>).every(
    (flag) => flag === undefined || typeof flag === 'boolean',
  )
}

function isOptionalPlainRecord(value: unknown): boolean {
  if (value === undefined) {
    return true
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false
  }
  return true
}
