import { PackageManifest, PackageManifestSchema } from '@prism/shared'

export type ManifestSummary = {
  manifest: PackageManifest
  identifier: { name: string; version: string }
  keywords: string[]
  license?: string
}

export const summarizeManifest = (manifest: PackageManifest) => {
  const parsed = PackageManifestSchema.parse(manifest)
  return {
    manifest: parsed,
    identifier: {
      name: parsed.name,
      version: parsed.version,
    },
    keywords: parsed.keywords ?? [],
    license: parsed.license,
  } satisfies ManifestSummary
}
