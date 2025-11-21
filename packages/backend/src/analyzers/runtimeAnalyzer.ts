import { PackageManifest, RuntimeAnalysisSchema } from '@prism/shared'

export const analyzeRuntime = (manifest: PackageManifest) => {
  const moduleFormat =
    manifest.type === 'module'
      ? 'esm'
      : manifest.type === 'commonjs'
      ? 'cjs'
      : 'hybrid'
  const types = manifest.types || manifest.typings ? 'types-field' : 'none'

  const compatibility = {
    node: true,
    bun: moduleFormat !== 'cjs',
    deno: moduleFormat === 'esm',
    workers: moduleFormat === 'esm',
  }

  const tags: ('typed' | 'esm-only' | 'runtime-safe')[] = []
  if (types !== 'none') tags.push('typed')
  if (moduleFormat === 'esm') tags.push('esm-only')
  if (compatibility.node && compatibility.deno && compatibility.workers) {
    tags.push('runtime-safe')
  }

  return RuntimeAnalysisSchema.parse({
    compatibility,
    moduleFormat,
    types,
    tags,
  })
}
