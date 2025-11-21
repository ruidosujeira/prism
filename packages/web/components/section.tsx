import type { PropsWithChildren, ReactNode } from 'react'

type SectionProps = PropsWithChildren<{
  title: string
  description?: string
  actions?: ReactNode
}>

export const Section = ({ title, description, actions, children }: SectionProps) => (
  <section className="mb-10 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl shadow-black/20">
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-[var(--text-muted)]">{description}</p>
        ) : null}
      </div>
      {actions}
    </div>
    {children}
  </section>
)
