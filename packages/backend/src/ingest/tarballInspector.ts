import { Readable } from 'node:stream'
import { createGunzip, gzipSync } from 'node:zlib'
import path from 'node:path'
import tar from 'tar-stream'
import {
  PackageManifest,
  PackageManifestSchema,
  toPosixPath,
} from '@prism/shared'

export type TarballFileEntry = {
  path: string
  segments: string[]
  depth: number
  size: {
    rawBytes: number
    gzipBytes: number
  }
  extension: string
  executable: boolean
}

export type TarballInspection = {
  manifest: PackageManifest
  files: TarballFileEntry[]
  generatedAt: string
}

export const inspectTarball = async (
  buffer: Buffer,
): Promise<TarballInspection> => {
  const extract = tar.extract()
  const files: TarballFileEntry[] = []
  let manifest: PackageManifest | null = null

  const normalizeEntry = (input: string) => {
    const withoutPrefix = input.replace(/^package\//, '')
    return toPosixPath(withoutPrefix)
  }

  await new Promise<void>((resolve, reject) => {
    extract.on('entry', (header, stream, next) => {
      const normalizedPath = normalizeEntry(header.name)
      const chunks: Buffer[] = []

      stream.on('data', (chunk) => chunks.push(chunk))
      stream.on('end', () => {
        if (!normalizedPath) {
          next()
          return
        }

        const content = Buffer.concat(chunks)
        const rawBytes = content.length
        const gzipBytes = rawBytes ? gzipSync(content).length : 0
        const segments = normalizedPath.split('/').filter(Boolean)
        const depth = Math.max(0, segments.length - 1)
        const extension = path
          .extname(normalizedPath)
          .replace(/\./, '')
          .toLowerCase()
        const entry: TarballFileEntry = {
          path: normalizedPath,
          segments,
          depth,
          size: { rawBytes, gzipBytes },
          extension,
          executable: Boolean(header.mode && header.mode & 0o111),
        }

        if (normalizedPath === 'package.json') {
          manifest = PackageManifestSchema.parse(
            JSON.parse(content.toString('utf8')),
          )
        }

        if (header.type === 'file') {
          files.push(entry)
        }

        next()
      })

      stream.on('error', reject)
      stream.resume()
    })

    extract.on('finish', () => resolve())
    extract.on('error', reject)

    Readable.from(buffer).pipe(createGunzip()).pipe(extract)
  })

  if (!manifest) {
    throw new Error('package.json not found in tarball')
  }

  return {
    manifest,
    files,
    generatedAt: new Date().toISOString(),
  }
}
