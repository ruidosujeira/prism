import Link from 'next/link'
import { Badge } from '@/components/badge'
import { MetaGrid } from '@/components/meta-grid'
import { Section } from '@/components/section'
import { getPackageSummary } from '@/lib/api'

export default async function PackagePage({
  params,
}: {
  params: { name: string }
}) {
  const summary = await getPackageSummary(params.name)

  if (!summary) {
    return (
      <Section title="Package" description="No metadata yet">
        <p className="text-[var(--text-muted)]">
          Package <code>{params.name}</code> has not been published.
        </p>
      </Section>
    )
  }

  return (
    <div className="space-y-8">
      <Section
        title={summary.name}
        description="Latest version overview"
        actions={
          <Link
            href={`/package/${summary.name}/version/${summary.latest}`}
            className="text-sm text-[var(--text-muted)]"
          >
            Inspect latest →
          </Link>
        }
      >
        <MetaGrid
          items={[
            { label: 'Latest', value: summary.latest },
            { label: 'Versions', value: summary.versions.length },
            { label: 'Tags', value: summary.tags.join(', ') },
          ]}
        />
      </Section>

      <Section title="Versions" description="Navigate releases">
        <div className="flex flex-wrap gap-3">
          {summary.versions.map((version) => (
            <Link
              key={version}
              href={`/package/${summary.name}/version/${version}`}
              className="rounded-full border border-[var(--border)] px-4 py-2 text-sm"
            >
              {version}
            </Link>
          ))}
        </div>
      </Section>
    </div>
  )
}
