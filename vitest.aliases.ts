// @ts-nocheck
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(fileURLToPath(new URL('.', import.meta.url)))

const aliasFor = (pkg: string) => {
  const sourcePath = path.resolve(repoRoot, 'packages', pkg, 'src')
  return [
    { find: `@prism/${pkg}`, replacement: sourcePath },
    { find: `@prism/${pkg}/`, replacement: `${sourcePath}/` },
  ]
}

export const prismAliases = [
  ...aliasFor('core'),
  ...aliasFor('shared'),
  ...aliasFor('storage-s3'),
]
