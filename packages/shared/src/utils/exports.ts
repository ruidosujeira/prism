import { toPosixPath } from './normalize'

/**
 * Normalize a single export path string into a canonical, POSIX style path
 * without leading './' or 'package/' prefixes.
 */
export const normalizeExportPath = (value: string): string =>
  toPosixPath(value).replace(/^((\.\/)+)/, '').replace(/^\//, '').replace(/^package\//, '')

/**
 * Normalize an exports record (already flattened to { condition: path }) by
 * cleaning each string value. Non-string values are ignored.
 */
export const normalizeExportsRecord = (
  record?: Record<string, unknown>,
): Record<string, string> => {
  if (!record) return {}
  const out: Record<string, string> = {}
  for (const [key, val] of Object.entries(record)) {
    if (typeof val === 'string' && val.length > 0) {
      out[key] = normalizeExportPath(val)
    }
  }
  return out
}
