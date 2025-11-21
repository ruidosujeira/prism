import Link from 'next/link'
import { MetaGrid } from '@/components/meta-grid'
import { Section } from '@/components/section'
import { getVersionMetadata } from '@/lib/api'

export default async function VersionPage({
  params,
}: {
  params: { name: string; version: string }
}) {
  const metadata = await getVersionMetadata(params.name, params.version)

  if (!metadata) {
    return (
      <Section title="Version" description="Missing metadata">
        <p className="text-[var(--text-muted)]">
          Version <code>{params.version}</code> is unavailable.
        </p>
      </Section>
    )
  }

  const summaryItems = [
    { label: 'Checksum', value: metadata.checksum.value.slice(0, 12) + '…' },
    { label: 'Published', value: metadata.release.publishedAt },
    { label: 'Maturity', value: metadata.release.maturityScore },
    { label: 'Module', value: metadata.runtime.moduleFormat },
    { label: 'Types', value: metadata.runtime.types },
    { label: 'Tags', value: metadata.tags.join(', ') },
  ]

  return (
    <div className="space-y-8">
      <Section
        title={`${metadata.identifier.name}@${metadata.identifier.version}`}
        description="Version metadata"
        actions={
          <div className="flex gap-3 text-sm text-[var(--text-muted)]">
            <Link href={`./${params.version}/files`}>Files</Link>
            <Link href={`./${params.version}/docs`}>Docs</Link>
          </div>
        }
      >
        <MetaGrid items={summaryItems} />
      </Section>
    </div>
  )
}
