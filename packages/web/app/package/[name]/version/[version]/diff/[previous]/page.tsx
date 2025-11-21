import { Section } from '@/components/section'
import { getDiff } from '@/lib/api'

export default async function DiffPage({
  params,
}: {
  params: { name: string; version: string; previous: string }
}) {
  const diff = await getDiff(params.name, params.version, params.previous)

  if (!diff) {
    return (
      <Section title="Diff" description="No diff available">
        <p className="text-[var(--text-muted)]">
          Cannot diff {params.previous} → {params.version} yet.
        </p>
      </Section>
    )
  }

  return (
    <Section
      title={`Diff ${diff.from.version} → ${diff.to.version}`}
      description="Changes across files, exports, and dependencies"
    >
      <div className="grid gap-6 md:grid-cols-3">
        <div>
          <h3 className="text-sm uppercase tracking-[0.3em] text-[var(--text-muted)]">
            Files
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-[var(--text-muted)]">
            {diff.files.slice(0, 8).map((change) => (
              <li key={`${change.path}-${change.change}`}>
                <span className="text-[var(--text)]">{change.path}</span> ·{' '}
                {change.change}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-sm uppercase tracking-[0.3em] text-[var(--text-muted)]">
            Exports
          </h3>
          <p className="mt-3 text-sm text-[var(--text-muted)]">
            +{diff.exports.added.length} / -{diff.exports.removed.length}
          </p>
        </div>
        <div>
          <h3 className="text-sm uppercase tracking-[0.3em] text-[var(--text-muted)]">
            Dependencies
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-[var(--text-muted)]">
            {diff.dependencies.slice(0, 6).map((dep) => (
              <li key={dep.name}>
                <span className="text-[var(--text)]">{dep.name}</span> ·{' '}
                {(dep.before ?? '—') + ' → ' + (dep.after ?? '—')}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  )
}
