/// <reference types="vitest" />
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { S3PrismStorage } from '../src'
import type { PrismManifest } from '@prism/core'

const manifest = (version: string): PrismManifest => ({
  name: 'demo-pkg',
  version,
  files: ['index.js'],
  integrity: 'sha512-test',
})

describe('S3PrismStorage', () => {
  let sendSpy: ReturnType<typeof vi.spyOn>
  let objectStore: Map<string, Buffer>

  beforeEach(() => {
    objectStore = new Map()
    sendSpy = vi
      .spyOn(S3Client.prototype, 'send')
      .mockImplementation(async (command: any) => {
        if (command instanceof PutObjectCommand) {
          objectStore.set(
            command.input.Key!,
            Buffer.isBuffer(command.input.Body)
              ? command.input.Body
              : Buffer.from(command.input.Body as string),
          )
          return {}
        }
        if (command instanceof GetObjectCommand) {
          const body = objectStore.get(command.input.Key!)
          if (!body) {
            const error = new Error('NotFound')
            ;(error as any).name = 'NoSuchKey'
            throw error
          }
          return { Body: body }
        }
        if (command instanceof ListObjectsV2Command) {
          const prefix = command.input.Prefix ?? ''
          const Contents = Array.from(objectStore.keys())
            .filter((key) => key.startsWith(prefix))
            .map((Key) => ({ Key }))
          return { Contents, IsTruncated: false }
        }
        throw new Error('Unsupported command')
      })
  })

  afterEach(() => {
    sendSpy.mockRestore()
  })

  it('persists and retrieves manifests', async () => {
    const storage = new S3PrismStorage({
      bucket: 'demo',
      region: 'us-east-1',
    })

    await storage.putManifest(manifest('1.0.0'))
    const loaded = await storage.getManifest('demo-pkg', '1.0.0')
    expect(loaded?.version).toBe('1.0.0')
  })

  it('lists versions and returns the latest manifest', async () => {
    const storage = new S3PrismStorage({
      bucket: 'demo',
      region: 'us-east-1',
      prefix: 'registry',
    })
    await storage.putManifest(manifest('1.0.0'))
    await storage.putManifest(manifest('1.5.0'))

    const versions = await storage.listVersions('demo-pkg')
    expect(versions).toEqual(['1.0.0', '1.5.0'])

    const latest = await storage.getLatestManifest('demo-pkg')
    expect(latest?.version).toBe('1.5.0')
  })
})
