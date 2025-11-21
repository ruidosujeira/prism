import type { ReactNode } from 'react'
import type { FileTreeNode } from '@prism/shared'
import { Section } from '@/components/section'
import { getFileTree } from '@/lib/api'

const formatBytes = (bytes: number) => `${(bytes / 1024).toFixed(1)}kb`

const renderTree = (tree: FileTreeNode[], depth = 0): ReactNode =>
  tree.map((node) => (
    <div key={node.path} style={{ marginLeft: depth * 16 }} className="py-1">
      <div className="flex items-center justify-between text-sm text-[var(--text-muted)]">
        <span>{node.path}</span>
        <span>{formatBytes(node.size.rawBytes)}</span>
      </div>
      {node.type === 'directory' && node.children
        ? renderTree(node.children, depth + 1)
        : null}
    </div>
  ))

export default async function FileTreePage({
  params,
}: {
  params: { name: string; version: string }
}) {
  const snapshot = await getFileTree(params.name, params.version)

  if (!snapshot) {
    return (
      <Section title="File tree" description="No snapshot stored">
        <p className="text-[var(--text-muted)]">Ingestion pending.</p>
      </Section>
    )
  }

  return (
    <Section
      title="File tree"
      description={`${snapshot.totalFiles} files · ${snapshot.totalDirectories} directories`}
    >
      <div className="max-h-[60vh] overflow-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm">
        {renderTree(snapshot.tree)}
      </div>
    </Section>
  )
}
