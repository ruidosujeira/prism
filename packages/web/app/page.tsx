import Link from 'next/link'
import { Badge } from '@/components/badge'
import { Section } from '@/components/section'

const featuredTags = ['typed', 'esm-only', 'zero-deps', 'tiny']

export default function HomePage() {
  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-[var(--border)] bg-gradient-to-br from-[var(--surface)] via-[var(--surface-muted)] to-[#08090f] p-10 shadow-2xl shadow-black/40">
        <p className="text-sm uppercase tracking-[0.4em] text-[var(--text-muted)]">
          Premium JavaScript Registry
        </p>
        <h2 className="mt-4 text-4xl font-semibold leading-tight">
          Deterministic transparency
          <br /> for every release.
        </h2>
        <p className="mt-4 max-w-2xl text-base text-[var(--text-muted)]">
          Prism captures export maps, file trees, types, runtime guarantees, and
          deep metadata for every published package. No surprises — only
          clarity.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {featuredTags.map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
        </div>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/search"
            className="inline-flex items-center justify-center rounded-full bg-white/90 px-6 py-3 text-sm font-medium uppercase tracking-[0.3em] text-black"
          >
            Search Registry
          </Link>
          <Link
            href="/package/example"
            className="inline-flex items-center justify-center rounded-full border border-[var(--border)] px-6 py-3 text-sm font-medium text-[var(--text-muted)]"
          >
            Inspect package
          </Link>
        </div>
      </section>

      <Section
        title="Registry timeline"
        description="Latest analyses ready for inspection."
        actions={
          <Link className="text-sm text-[var(--text-muted)]" href="/search">
            View all →
          </Link>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((item) => (
            <article
              key={item}
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4"
            >
              <div className="flex items-center justify-between text-sm text-[var(--text-muted)]">
                <span>pkg-{item}</span>
                <span>v1.{item}.0</span>
              </div>
              <p className="mt-3 text-base font-medium">
                Stable release with typed exports and zero runtime surprises.
              </p>
            </article>
          ))}
        </div>
      </Section>
    </div>
  )
}
