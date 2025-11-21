/// <reference types="vitest" />
import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Packages } from '../src/pages/Packages'
import { fetchPackages } from '../src/api/client'

vi.mock('../src/api/client', async () => {
  const actual = await vi.importActual<typeof import('../src/api/client')>(
    '../src/api/client',
  )
  return {
    ...actual,
    fetchPackages: vi.fn(),
  }
})

const mockFetchPackages = vi.mocked(fetchPackages)

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/']}>
      <Packages />
    </MemoryRouter>,
  )

describe('Packages page', () => {
  it('renders a grid of packages from the API', async () => {
    mockFetchPackages.mockResolvedValue([
      {
        name: 'pkg-one',
        latest: '1.0.0',
        versions: ['1.0.0'],
        tags: ['stable'],
      },
      {
        name: 'pkg-two',
        latest: '2.0.0',
        versions: ['2.0.0'],
        tags: ['typed'],
      },
    ])

    renderPage()

    await waitFor(() => expect(mockFetchPackages).toHaveBeenCalled())
    expect(await screen.findByText('pkg-one')).toBeInTheDocument()
    expect(screen.getByText('pkg-two')).toBeInTheDocument()
  })
})
