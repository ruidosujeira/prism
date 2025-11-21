import {
  GetObjectCommand,
  type GetObjectCommandOutput,
  ListObjectsV2Command,
  type ListObjectsV2CommandOutput,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { Readable } from 'node:stream'
import {
  type PrismManifest,
  type PrismStorage,
  isValidPrismManifest,
} from '@prism/core'
import { normalizePackageName, normalizeVersion } from '@prism/shared'

export interface S3PrismStorageOptions {
  bucket: string
  region: string
  prefix?: string
  endpoint?: string
  accessKeyId?: string
  secretAccessKey?: string
}

type Credentials = {
  accessKeyId: string
  secretAccessKey: string
}

const isReadable = (value: unknown): value is Readable =>
  typeof value === 'object' && value !== null && value instanceof Readable

const collectBody = async (
  body: GetObjectCommandOutput['Body'],
): Promise<Buffer> => {
  if (!body) {
    return Buffer.alloc(0)
  }
  if (Buffer.isBuffer(body)) {
    return body
  }
  if (body instanceof Uint8Array) {
    return Buffer.from(body)
  }
  if (typeof body === 'string') {
    return Buffer.from(body)
  }
  if (isReadable(body)) {
    const chunks: Buffer[] = []
    for await (const chunk of body) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    }
    return Buffer.concat(chunks)
  }
  if (
    typeof (body as { transformToByteArray?: () => Promise<Uint8Array> })
      ?.transformToByteArray === 'function'
  ) {
    const array = await (
      body as {
        transformToByteArray: () => Promise<Uint8Array>
      }
    ).transformToByteArray()
    return Buffer.from(array)
  }
  throw new Error('Unsupported S3 body type')
}

const compareSemver = (a: string, b: string) => {
  const parse = (value: string) => value.split('.').map((part) => Number(part))
  const left = parse(a)
  const right = parse(b)
  for (let i = 0; i < Math.max(left.length, right.length); i += 1) {
    const delta = (left[i] || 0) - (right[i] || 0)
    if (delta !== 0) return delta
  }
  return 0
}

export class S3PrismStorage implements PrismStorage {
  private readonly client: S3Client
  private readonly bucket: string
  private readonly prefix: string

  constructor(options: S3PrismStorageOptions) {
    const credentials: Credentials | undefined =
      options.accessKeyId && options.secretAccessKey
        ? {
            accessKeyId: options.accessKeyId,
            secretAccessKey: options.secretAccessKey,
          }
        : undefined

    this.client = new S3Client({
      region: options.region,
      endpoint: options.endpoint,
      credentials,
    })
    this.bucket = options.bucket
    this.prefix = options.prefix ?? 'prism'
  }

  private manifestKey(name: string, version: string) {
    return `${this.prefix}/manifests/${normalizePackageName(
      name,
    )}/${normalizeVersion(version)}.json`
  }

  private packagePrefix(name: string) {
    return `${this.prefix}/manifests/${normalizePackageName(name)}/`
  }

  async putManifest(manifest: PrismManifest): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: this.manifestKey(manifest.name, manifest.version),
        Body: JSON.stringify(manifest),
        ContentType: 'application/json',
      }),
    )
  }

  async getManifest(
    name: string,
    version: string,
  ): Promise<PrismManifest | null> {
    try {
      const response = await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: this.manifestKey(name, version),
        }),
      )
      const payload = JSON.parse((await collectBody(response.Body)).toString())
      return isValidPrismManifest(payload) ? payload : null
    } catch (error) {
      const code = (error as { name?: string }).name
      const status = (error as { $metadata?: { httpStatusCode?: number } })
        .$metadata?.httpStatusCode
      if (code === 'NoSuchKey' || status === 404) {
        return null
      }
      throw error
    }
  }

  async getLatestManifest(name: string): Promise<PrismManifest | null> {
    const versions = await this.listVersions(name)
    if (!versions.length) {
      return null
    }
    return this.getManifest(name, versions[versions.length - 1])
  }

  async listVersions(name: string): Promise<string[]> {
    const versions = new Set<string>()
    let continuation: string | undefined
    const prefix = this.packagePrefix(name)

    do {
      const response: ListObjectsV2CommandOutput = await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: prefix,
          ContinuationToken: continuation,
        }),
      )
      response.Contents?.forEach((objectEntry: { Key?: string }) => {
        const key = objectEntry.Key
        if (!key || !key.startsWith(prefix)) return
        const relative = key.slice(prefix.length)
        if (!relative || !relative.endsWith('.json')) return
        const version = relative.replace(/\.json$/, '')
        versions.add(normalizeVersion(version))
      })
      continuation = response.IsTruncated
        ? response.NextContinuationToken
        : undefined
    } while (continuation)

    return Array.from(versions).sort(compareSemver)
  }
}
