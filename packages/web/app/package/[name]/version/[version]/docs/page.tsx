import { Section } from '@/components/section'

const docsSections = ['README', 'Changelog', 'Examples']

export default function DocsPage({
  params,
}: {
  params: { name: string; version: string }
}) {
  return (
    <Section
      title={`${params.name}@${params.version} · Docs`}
      description="Unified docs renderer"
    >
      <div className="space-y-6">
        {docsSections.map((section) => (
          <article
            key={section}
            className="rounded-2xl border border-[var(--border)] p-4"
          >
            <h3 className="text-sm uppercase tracking-[0.3em] text-[var(--text-muted)]">
              {section}
            </h3>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              Content pipeline pending ingestion hookup.
            </p>
          </article>
        ))}
      </div>
    </Section>
  )
}
