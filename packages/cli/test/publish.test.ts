/// <reference types="vitest" />
import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildProgram } from '../src'

const context = { registryUrl: 'https://registry.test' }

let tempDir: string

const writeJson = async (target: string, payload: unknown) => {
  await fs.writeFile(target, JSON.stringify(payload, null, 2), 'utf8')
}

beforeEach(async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'prism-cli-publish-'))
  await writeJson(path.join(tempDir, 'package.json'), {
    name: 'demo-pkg',
    version: '1.0.0',
    author: 'CLI Tester',
  })
  await fs.writeFile(
    path.join(tempDir, 'index.js'),
    'module.exports = 42',
    'utf8',
  )
})

afterEach(async () => {
  await fs.rm(tempDir, { recursive: true, force: true })
  vi.restoreAllMocks()
})

describe('prism publish command', () => {
  it('creates a tarball and posts payload to the registry', async () => {
    const responsePayload = {
      identifier: { name: 'demo-pkg', version: '1.0.0' },
      metadata: {
        identifier: { name: 'demo-pkg', version: '1.0.0' },
        checksum: { algorithm: 'sha256', value: 'c'.repeat(64) },
        dist: {
          tarball: 'packages/demo-pkg/1.0.0.tgz',
          integrity: `sha256-${'c'.repeat(64)}`,
          fileName: 'demo-pkg-1.0.0.tgz',
        },
        distribution: {
          rawBytes: 1024,
          gzipBytes: 256,
          fileCount: 10,
          directoryCount: 2,
        },
        dependencies: {},
        devDependencies: {},
        peerDependencies: {},
        optionalDependencies: {},
        exports: {
          entries: [],
          hasExportMap: false,
          inferredFormat: 'esm',
          types: 'bundled',
        },
        runtime: {
          compatibility: {
            node: true,
            deno: true,
            bun: true,
            workers: false,
            notes: [],
          },
          moduleFormat: 'esm',
          types: 'bundled',
          tags: ['stable'],
        },
        tags: ['stable'],
        release: {
          publishedAt: new Date(0).toISOString(),
          maturityScore: 80,
        },
      },
    }
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => responsePayload,
      text: async () => JSON.stringify(responsePayload),
    } as any)
    vi.spyOn(console, 'log').mockImplementation(() => undefined)

    const program = buildProgram(context)
    await program.parseAsync(['node', 'prism', 'publish', '--dir', tempDir])

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [, requestInit] = fetchMock.mock.calls[0]
    expect(requestInit?.method).toBe('POST')
    const body = JSON.parse(requestInit?.body as string)
    expect(body.publisher.name).toBe('CLI Tester')
    expect(typeof body.tarballBase64).toBe('string')
    expect(body.tarballBase64.length).toBeGreaterThan(10)
    expect(body.source).toBe('cli')
    expect(body.sha256).toHaveLength(64)
  })
})
