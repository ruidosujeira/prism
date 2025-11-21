import Link from 'next/link'
import { Badge } from '@/components/badge'
import { Section } from '@/components/section'

export default function SearchPage({
  searchParams,
}: {
  searchParams?: { q?: string }
}) {
  const query = searchParams?.q?.trim() ?? ''
  const results = Array.from({ length: 5 }, (_, idx) => ({
    name: `pkg-${idx + 1}`,
    version: `1.${idx}.0`,
    summary: 'Typed exports, runtime-safe, zero deps',
    tags: ['typed', 'runtime-safe'],
  }))

  return (
    <div className="space-y-8">
      <Section title="Search" description="Inspect packages by keyword">
        <form className="flex flex-col gap-4 sm:flex-row">
          <input
            name="q"
            defaultValue={query}
            placeholder="Search packages, exports, tags"
            className="flex-1 rounded-2xl border border-[var(--border)] bg-transparent px-5 py-3 text-base outline-none"
          />
          <button className="rounded-2xl border border-[var(--border)] px-6 py-3 text-sm font-medium uppercase tracking-[0.3em]">
            Search
          </button>
        </form>
      </Section>

      <Section title="Results" description="Instant metadata overview">
        <div className="space-y-4">
          {results.map((result) => (
            <Link
              key={result.name}
              href={`/package/${result.name}`}
              className="block rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 py-4 transition hover:border-white/40"
            >
              <div className="flex items-center justify-between text-sm text-[var(--text-muted)]">
                <span>{result.name}</span>
                <span>{result.version}</span>
              </div>
              <p className="mt-2 text-base font-medium">{result.summary}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {result.tags.map((tag) => (
                  <Badge key={tag}>{tag}</Badge>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </Section>
    </div>
  )
}
