import { FileTreeNode, VersionDiffSchema } from '@prism/shared'
import { packageRepository } from '../repositories/packageRepository'

const normalizeMap = (record: Record<string, string> = {}) => record || {}

const collectFileNodes = (
  nodes: FileTreeNode[] = [],
  acc: Map<string, FileTreeNode>,
) => {
  for (const node of nodes) {
    if (node.type === 'file') {
      acc.set(node.path, node)
    } else if (node.children) {
      collectFileNodes(node.children, acc)
    }
  }
}

class DiffService {
  async diff(name: string, fromVersion: string, toVersion: string) {
    const [from, to] = await Promise.all([
      packageRepository.getVersion(name, fromVersion),
      packageRepository.getVersion(name, toVersion),
    ])

    if (!from || !to) {
      throw new Error('Unable to load versions for diff')
    }

    const fileSetBefore = new Map<string, FileTreeNode>()
    const fileSetAfter = new Map<string, FileTreeNode>()
    if (from.files?.tree) collectFileNodes(from.files.tree, fileSetBefore)
    if (to.files?.tree) collectFileNodes(to.files.tree, fileSetAfter)

    const fileChanges: Array<{
      path: string
      change: 'added' | 'removed' | 'modified'
      before?: { rawBytes: number; gzipBytes: number }
      after?: { rawBytes: number; gzipBytes: number }
    }> = []

    for (const [path, node] of fileSetBefore.entries()) {
      if (!fileSetAfter.has(path)) {
        fileChanges.push({ path, change: 'removed', before: node.size })
      } else {
        const other = fileSetAfter.get(path)!
        if (other.size.rawBytes !== node.size.rawBytes) {
          fileChanges.push({
            path,
            change: 'modified',
            before: node.size,
            after: other.size,
          })
        }
      }
    }

    for (const [path, node] of fileSetAfter.entries()) {
      if (!fileSetBefore.has(path)) {
        fileChanges.push({ path, change: 'added', after: node.size })
      }
    }

    const depsBefore = normalizeMap(from.dependencies)
    const depsAfter = normalizeMap(to.dependencies)
    const dependencyNames = new Set([
      ...Object.keys(depsBefore),
      ...Object.keys(depsAfter),
    ])
    const dependencyDiff = Array.from(dependencyNames).reduce<
      Array<{ name: string; before?: string; after?: string }>
    >((acc, dep) => {
      if (depsBefore[dep] === depsAfter[dep]) return acc
      acc.push({ name: dep, before: depsBefore[dep], after: depsAfter[dep] })
      return acc
    }, [])

    const exportNamesBefore = new Set(
      from.exports.entries.map((entry) => entry.name),
    )
    const exportNamesAfter = new Set(
      to.exports.entries.map((entry) => entry.name),
    )

    const exportAdded = to.exports.entries.filter(
      (entry) => !exportNamesBefore.has(entry.name),
    )
    const exportRemoved = from.exports.entries.filter(
      (entry) => !exportNamesAfter.has(entry.name),
    )

    return VersionDiffSchema.parse({
      from: from.identifier,
      to: to.identifier,
      files: fileChanges,
      exports: { added: exportAdded, removed: exportRemoved },
      dependencies: dependencyDiff,
      sizeByDirectory: {
        before: from.sizeByDirectory ?? [],
        after: to.sizeByDirectory ?? [],
      },
    })
  }
}

export const diffService = new DiffService()
