/// <reference types="vitest" />
import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { PackageDetail } from '../src/pages/PackageDetail'
import { fetchPackage } from '../src/api/client'

vi.mock('../src/api/client', async () => {
  const actual = await vi.importActual<typeof import('../src/api/client')>(
    '../src/api/client',
  )
  return {
    ...actual,
    fetchPackage: vi.fn(),
  }
})

const mockFetchPackage = vi.mocked(fetchPackage)

const renderWithRouter = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/packages/:name" element={<PackageDetail />} />
      </Routes>
    </MemoryRouter>,
  )

describe('PackageDetail page', () => {
  it('shows metadata and versions for a package', async () => {
    mockFetchPackage.mockResolvedValue({
      name: 'demo-pkg',
      latest: '1.2.3',
      versions: ['1.2.3', '1.2.2'],
      tags: ['stable', 'typed'],
    })

    renderWithRouter('/packages/demo-pkg')

    await waitFor(() =>
      expect(mockFetchPackage).toHaveBeenCalledWith('demo-pkg'),
    )
    expect(await screen.findByText('demo-pkg')).toBeInTheDocument()
    expect(screen.getByText('Latest version: 1.2.3')).toBeInTheDocument()
    expect(screen.getByText('1.2.2')).toBeInTheDocument()
  })
})
