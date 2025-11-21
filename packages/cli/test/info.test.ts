/// <reference types="vitest" />
import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildProgram } from '../src'

const context = { registryUrl: 'https://registry.test' }

afterEach(() => {
  vi.restoreAllMocks()
})

describe('prism info command', () => {
  it('fetches package metadata and prints summary', async () => {
    const payload = {
      name: 'demo-pkg',
      latest: '1.2.3',
      versions: ['1.2.3', '1.2.2'],
      tags: ['stable'],
    }
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => payload,
      text: async () => JSON.stringify(payload),
    } as any)
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined)

    const program = buildProgram(context)
    await program.parseAsync(['node', 'prism', 'info', 'demo-pkg'])

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url] = fetchMock.mock.calls[0]
    expect(String(url)).toContain('/v1/packages/demo-pkg')
    expect(logSpy).toHaveBeenCalledWith('Package: demo-pkg')
    expect(logSpy).toHaveBeenCalledWith('Latest:  1.2.3')
  })
})
