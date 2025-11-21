/// <reference types="vitest" />
import { describe, expect, it } from 'vitest'
import {
  PackageIdentifierSchema,
  PackageManifestSchema,
  PublishPayloadSchema,
  VersionMetadataSchema,
} from '../src'

const iso = () => new Date().toISOString()

const baseMetadata = {
  identifier: { name: 'demo-pkg', version: '1.0.0' },
  description: 'Demo package',
  keywords: ['demo'],
  license: 'MIT',
  repository: { type: 'git', url: 'https://github.com/demo/repo.git' },
  homepage: 'https://example.com',
  author: { name: 'Dev', email: 'dev@example.com' },
  bugs: { url: 'https://example.com/issues', email: 'bugs@example.com' },
  checksum: {
    algorithm: 'sha256',
    value: 'a'.repeat(64),
  },
  dist: {
    tarball: 'packages/demo/1.0.0.tgz',
    integrity: `sha256-${'a'.repeat(64)}`,
    fileName: 'demo-1.0.0.tgz',
  },
  files: {
    generatedAt: iso(),
    totalFiles: 10,
    totalDirectories: 2,
    tree: [],
  },
  distribution: {
    rawBytes: 1024,
    gzipBytes: 512,
    fileCount: 10,
    directoryCount: 2,
  },
  sizeByDirectory: [{ path: 'src', size: { rawBytes: 512, gzipBytes: 256 } }],
  dependencies: {},
  devDependencies: {},
  peerDependencies: {},
  optionalDependencies: {},
  exports: {
    entries: [
      {
        name: '.',
        type: 'value',
        targets: [
          {
            condition: 'import',
            path: './index.js',
            format: 'esm',
            types: true,
          },
        ],
      },
    ],
    hasExportMap: true,
    inferredFormat: 'esm',
    types: 'bundled',
  },
  runtime: {
    compatibility: {
      node: true,
      bun: true,
      deno: false,
      workers: false,
      notes: [],
    },
    moduleFormat: 'esm',
    types: 'bundled',
    tags: ['stable'],
  },
  tags: ['stable'],
  release: {
    publishedAt: iso(),
    maturityScore: 85,
    releaseFrequencyDays: 30,
    previousVersion: '0.9.0',
  },
}

describe('schema validation', () => {
  it('parses package manifests and identifiers', () => {
    expect(
      PackageManifestSchema.safeParse({ name: 'demo', version: '1.0.0' })
        .success,
    ).toBe(true)
    expect(
      PackageIdentifierSchema.safeParse({ name: 'demo', version: '1.0.0' })
        .success,
    ).toBe(true)
  })

  it('validates publish payloads', () => {
    const payload = {
      tarballBase64: Buffer.from('demo').toString('base64'),
      sha256: 'b'.repeat(64),
      publisher: { name: 'CI', email: 'ci@example.com' },
      source: 'cli' as const,
    }
    expect(PublishPayloadSchema.safeParse(payload).success).toBe(true)
  })

  it('validates rich version metadata and catches invalid checksums', () => {
    expect(VersionMetadataSchema.safeParse(baseMetadata).success).toBe(true)

    const invalid = {
      ...baseMetadata,
      checksum: { algorithm: 'sha256', value: 'zzz' },
    }
    expect(VersionMetadataSchema.safeParse(invalid).success).toBe(false)
  })
})
