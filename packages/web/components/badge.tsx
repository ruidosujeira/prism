import type { PropsWithChildren } from 'react'

export const Badge = ({ children }: PropsWithChildren) => (
  <span className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-1 text-xs uppercase tracking-wide text-[var(--text-muted)]">
    {children}
  </span>
)
