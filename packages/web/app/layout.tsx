import type { Metadata } from 'next'
import Link from 'next/link'
import type { ReactNode } from 'react'
import './globals.css'

export const metadata: Metadata = {
  title: 'Prism Registry',
  description: 'A premium JavaScript package registry focused on clarity.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10">
          <header className="flex flex-col gap-6 border-b border-[var(--border)] pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-[var(--text-muted)]">
                Registry
              </p>
              <h1 className="text-3xl font-semibold">Prism</h1>
            </div>
            <nav className="flex gap-4 text-sm text-[var(--text-muted)]">
              <Link href="/">Home</Link>
              <Link href="/search">Search</Link>
              <Link href="/package/example">Package</Link>
            </nav>
          </header>
          <main className="flex-1 py-10">{children}</main>
          <footer className="border-t border-[var(--border)] pt-4 text-xs text-[var(--text-muted)]">
            Prism Registry · Transparency for the JavaScript ecosystem
          </footer>
        </div>
      </body>
    </html>
  )
}
