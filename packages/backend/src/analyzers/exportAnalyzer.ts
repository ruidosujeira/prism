import { ExportsMapSchema, PackageManifest } from '@prism/shared'

const normalizePath = (value: string | undefined) => {
  if (!value) return undefined
  return value.startsWith('.') ? value : `./${value}`
}

export const analyzeExports = (manifest: PackageManifest) => {
  const exportsField = manifest.exports
  const entries: Array<{
    name: string
    type: 'value' | 'type'
    targets: Array<{
      condition: string
      path: string
      format: 'esm' | 'cjs' | 'hybrid'
      types: boolean
    }>
  }> = []

  if (typeof exportsField === 'string') {
    entries.push({
      name: '.',
      type: 'value',
      targets: [
        {
          condition: 'default',
          path: normalizePath(exportsField) ?? './index.js',
          format: manifest.type === 'module' ? 'esm' : 'cjs',
          types: Boolean(manifest.types || manifest.typings),
        },
      ],
    })
  } else if (exportsField && typeof exportsField === 'object') {
    for (const [key, value] of Object.entries(
      exportsField as Record<string, unknown>,
    )) {
      if (typeof value === 'string') {
        entries.push({
          name: key,
          type: 'value',
          targets: [
            {
              condition: 'default',
              path: normalizePath(value) ?? './index.js',
              format: manifest.type === 'module' ? 'esm' : 'cjs',
              types: Boolean(manifest.types || manifest.typings),
            },
          ],
        })
      }
    }
  }

  if (!entries.length) {
    const fallback =
      normalizePath(manifest.module ?? manifest.main ?? 'index.js') ??
      './index.js'
    entries.push({
      name: '.',
      type: 'value',
      targets: [
        {
          condition: 'default',
          path: fallback,
          format: manifest.type === 'module' ? 'esm' : 'hybrid',
          types: Boolean(manifest.types || manifest.typings),
        },
      ],
    })
  }

  const inferredFormat =
    manifest.type === 'module'
      ? 'esm'
      : manifest.type === 'commonjs'
      ? 'cjs'
      : entries.some((entry) =>
          entry.targets.some((target) => target.format === 'esm'),
        )
      ? 'esm'
      : 'cjs'
  const typesPresence =
    manifest.types || manifest.typings ? 'types-field' : 'none'

  return ExportsMapSchema.parse({
    entries,
    hasExportMap: Boolean(exportsField),
    inferredFormat,
    types: typesPresence,
  })
}
