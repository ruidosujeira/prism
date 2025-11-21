import {
  DirectorySizeBreakdownSchema,
  FileTreeSnapshotSchema,
  FileTreeNode,
} from '@prism/shared'
import type { FileTreeSnapshot } from '@prism/shared'
import { TarballFileEntry } from '../ingest/tarballInspector'

export type FileTreeAnalysis = {
  snapshot: FileTreeSnapshot
  sizeByDirectory: ReturnType<typeof DirectorySizeBreakdownSchema.parse>
}

type DirectoryAccumulator = {
  name: string
  path: string
  depth: number
  children: Map<string, DirectoryAccumulator>
  files: TarballFileEntry[]
  size: { rawBytes: number; gzipBytes: number }
}

const createDirectory = (
  name: string,
  path: string,
  depth: number,
): DirectoryAccumulator => ({
  name,
  path,
  depth,
  children: new Map(),
  files: [],
  size: { rawBytes: 0, gzipBytes: 0 },
})

export const analyzeFileTree = (
  files: TarballFileEntry[],
  generatedAt: string,
): FileTreeAnalysis => {
  const root = createDirectory('', '', 0)
  let totalDirectories = 0

  for (const file of files) {
    let current = root
    file.segments.slice(0, -1).forEach((segment, index) => {
      const segmentPath = current.path ? `${current.path}/${segment}` : segment
      if (!current.children.has(segment)) {
        current.children.set(
          segment,
          createDirectory(segment, segmentPath, current.depth + 1),
        )
        totalDirectories += 1
      }
      current = current.children.get(segment)!
    })
    current.files.push(file)
  }

  const directorySizes: {
    path: string
    size: { rawBytes: number; gzipBytes: number }
  }[] = []

  const toTreeNodes = (dir: DirectoryAccumulator): FileTreeNode[] => {
    const childNodes: FileTreeNode[] = []
    for (const child of dir.children.values()) {
      const children = toTreeNodes(child)
      const node: FileTreeNode = {
        type: 'directory',
        path: child.path || '.',
        relativePath: child.path || '.',
        depth: child.depth,
        size: child.size,
        children,
        extension: undefined,
      } as FileTreeNode
      childNodes.push(node)
    }

    for (const file of dir.files) {
      childNodes.push({
        type: 'file',
        path: file.path,
        relativePath: file.path,
        depth: file.depth,
        size: file.size,
        extension: file.extension,
        executable: file.executable,
      })
      dir.size.rawBytes += file.size.rawBytes
      dir.size.gzipBytes += file.size.gzipBytes
    }

    for (const child of dir.children.values()) {
      dir.size.rawBytes += child.size.rawBytes
      dir.size.gzipBytes += child.size.gzipBytes
    }

    const directoryPath = dir.path || '.'
    directorySizes.push({ path: directoryPath, size: dir.size })

    return childNodes.sort((a, b) => a.path.localeCompare(b.path))
  }

  const tree = toTreeNodes(root)

  const snapshot = FileTreeSnapshotSchema.parse({
    generatedAt,
    totalFiles: files.length,
    totalDirectories,
    tree,
  })

  return {
    snapshot,
    sizeByDirectory: DirectorySizeBreakdownSchema.parse(directorySizes),
  }
}
