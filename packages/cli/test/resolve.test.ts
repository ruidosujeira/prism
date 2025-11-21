/// <reference types="vitest" />
import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildProgram } from '../src'

const context = { registryUrl: 'https://registry.test' }

afterEach(() => {
  vi.restoreAllMocks()
})

describe('prism resolve command', () => {
  it('prints resolved entry information', async () => {
    const payload = {
      entryPath: 'index.js',
      format: 'esm',
      runtime: 'node',
      url: 'https://registry.test/packages/demo/1.0.0/index.js',
      typesUrl: 'https://registry.test/packages/demo/1.0.0/index.d.ts',
    }
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => payload,
      text: async () => JSON.stringify(payload),
    } as any)
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined)

    const program = buildProgram(context)
    await program.parseAsync([
      'node',
      'prism',
      'resolve',
      'demo@1.0.0',
      '--runtime',
      'node',
    ])

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url] = fetchMock.mock.calls[0]
    expect(String(url)).toContain('/v1/resolve')
    expect(logSpy).toHaveBeenCalledWith('Runtime:  node')
    expect(logSpy).toHaveBeenCalledWith(`URL:      ${payload.url}`)
  })
})
