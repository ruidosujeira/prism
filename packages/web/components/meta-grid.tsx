type MetaItem = {
  label: string
  value: string | number | undefined
}

export const MetaGrid = ({ items }: { items: MetaItem[] }) => (
  <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
    {items.map((item) => (
      <div
        key={item.label}
        className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3"
      >
        <dt className="text-xs uppercase tracking-[0.25em] text-[var(--text-muted)]">
          {item.label}
        </dt>
        <dd className="mt-1 text-base font-medium">{item.value ?? '—'}</dd>
      </div>
    ))}
  </dl>
)
