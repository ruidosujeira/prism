/// <reference types="vitest" />
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { VersionDetail } from '../src/pages/VersionDetail'
import { fetchPackageVersion, fetchResolution } from '../src/api/client'

vi.mock('../src/api/client', async () => {
  const actual = await vi.importActual<typeof import('../src/api/client')>(
    '../src/api/client',
  )
  return {
    ...actual,
    fetchPackageVersion: vi.fn(),
    fetchResolution: vi.fn(),
  }
})

const mockFetchPackageVersion = vi.mocked(fetchPackageVersion)
const mockFetchResolution = vi.mocked(fetchResolution)

const renderPage = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/packages/:name/:version" element={<VersionDetail />} />
      </Routes>
    </MemoryRouter>,
  )

beforeEach(() => {
  mockFetchResolution.mockReset()
})

describe('VersionDetail page', () => {
  it('renders manifest, runtime signals, and provenance', async () => {
    mockFetchPackageVersion.mockResolvedValue({
      metadata: {
        identifier: { name: 'demo-pkg', version: '1.0.0' },
        dist: {
          tarball: '/packages/demo-pkg/1.0.0/demo.tgz',
          integrity: 'sha256-demo',
          fileName: 'demo.tgz',
        },
        distribution: { rawBytes: 2048, gzipBytes: 1024 },
        runtime: {
          compatibility: { node: 'supported', deno: false, bun: true },
          types: 'bundle',
          tags: ['stable'],
        },
        exports: { '.': './index.js' },
        tags: ['stable'],
        release: {
          publishedAt: new Date().toISOString(),
          maturityScore: 80,
        },
        checksum: 'sha256-demo',
        files: {
          generatedAt: new Date().toISOString(),
          totalFiles: 10,
          totalDirectories: 2,
        },
      },
      manifest: {
        name: 'demo-pkg',
        version: '1.0.0',
        files: ['index.js'],
        integrity: 'sha512-demo',
      },
    } as any)

    mockFetchResolution.mockImplementation(async (_spec, runtime) => ({
      entryPath: `${runtime}.js`,
      format: runtime === 'deno' ? 'esm' : 'cjs',
      runtime,
      url: `https://cdn.test/${runtime}.js`,
    }))

    renderPage('/packages/demo-pkg/1.0.0')

    await waitFor(() => expect(mockFetchPackageVersion).toHaveBeenCalled())
    expect(await screen.findByText('demo-pkg@1.0.0')).toBeInTheDocument()
    expect(screen.getByText(/Integrity: sha512-demo/)).toBeInTheDocument()

    await waitFor(() => expect(mockFetchResolution).toHaveBeenCalledTimes(3))
    expect(screen.getByText('node')).toBeInTheDocument()
    expect(screen.getByText('deno')).toBeInTheDocument()
  })
})
