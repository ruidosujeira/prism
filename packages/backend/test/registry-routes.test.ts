/// <reference types="vitest" />
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  InMemoryPrismStorage,
  type PrismManifest,
  type PrismStorage,
} from '@prism/core'
import { createServer } from '../src/server'
import { publishService } from '../src/services/publishService'
import { packageRepository } from '../src/repositories/packageRepository'
import * as storageFactory from '../src/storage/storageFactory'

const manifest = (overrides: Partial<PrismManifest> = {}): PrismManifest => ({
  name: 'demo-pkg',
  version: '1.0.0',
  files: ['index.js'],
  integrity: 'sha512-demo',
  ...overrides,
})

describe('registry routes', () => {
  let server: Awaited<ReturnType<typeof createServer>>
  let storageRef: PrismStorage

  const createStorageMock = (): PrismStorage =>
    ({
      putManifest: vi.fn(),
      getManifest: vi.fn(),
      getLatestManifest: vi.fn(),
      listVersions: vi.fn(),
    } as unknown as PrismStorage)

  beforeEach(async () => {
    storageRef = createStorageMock()
    vi.spyOn(storageFactory, 'getPrismStorage').mockImplementation(
      () => storageRef,
    )
    server = await createServer()
  })

  afterEach(async () => {
    await server.close()
    vi.restoreAllMocks()
  })

  it('publishes packages via POST /v1/packages/:name', async () => {
    const responsePayload = {
      identifier: { name: 'demo-pkg', version: '1.0.0' },
      metadata: { checksum: { algorithm: 'sha256', value: 'a'.repeat(64) } },
    }
    vi.spyOn(publishService, 'publish').mockResolvedValue(
      responsePayload as any,
    )

    const response = await server.inject({
      method: 'POST',
      url: '/v1/packages/demo-pkg',
      payload: {
        tarballBase64: Buffer.from('demo').toString('base64'),
        sha256: 'b'.repeat(64),
        publisher: { name: 'CI' },
        source: 'cli',
      },
    })

    expect(response.statusCode).toBe(201)
    expect(JSON.parse(response.body)).toEqual(responsePayload)
  })

  it('lists packages via GET /v1/packages', async () => {
    const packages = [
      {
        name: 'demo-pkg',
        latest: '1.0.0',
        versions: ['1.0.0'],
        tags: ['stable'],
      },
    ]
    vi.spyOn(packageRepository, 'listPackages').mockResolvedValue(
      packages as any,
    )

    const response = await server.inject({ method: 'GET', url: '/v1/packages' })
    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body)).toEqual(packages)
  })

  it('returns package summary via GET /v1/packages/:name', async () => {
    const summary = {
      name: 'demo-pkg',
      latest: '1.0.0',
      versions: ['1.0.0', '0.9.0'],
      tags: ['stable'],
    }
    vi.spyOn(packageRepository, 'getPackageIndex').mockResolvedValue(
      summary as any,
    )

    const response = await server.inject({
      method: 'GET',
      url: '/v1/packages/demo-pkg',
    })

    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body)).toEqual(summary)
  })

  it('returns package detail via GET /v1/packages/:name/:version', async () => {
    const metadata = { identifier: { name: 'demo-pkg', version: '1.0.0' } }
    vi.spyOn(packageRepository, 'getVersion').mockResolvedValue(metadata as any)
    ;(storageRef.getManifest as any).mockResolvedValue(manifest())

    const response = await server.inject({
      method: 'GET',
      url: '/v1/packages/demo-pkg/1.0.0',
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.metadata).toEqual(metadata)
    expect(body.manifest.name).toBe('demo-pkg')
  })

  it('resolves specs via GET /v1/resolve using Prism storage', async () => {
    storageRef = new InMemoryPrismStorage()
    await storageRef.putManifest(manifest())

    const response = await server.inject({
      method: 'GET',
      url: '/v1/resolve?spec=demo-pkg@1.0.0&runtime=node&baseUrl=https://cdn.test',
    })

    expect(response.statusCode).toBe(200)
    const payload = JSON.parse(response.body)
    expect(payload.entryPath).toBe('index.js')
    expect(payload.url).toBe(
      'https://cdn.test/packages/demo-pkg/1.0.0/index.js',
    )
  })
})
