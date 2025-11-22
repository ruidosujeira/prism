import path from 'node:path'
import type { PackageManifest } from '@prism/shared'
import {
  PublishPayload,
  PublishResponseSchema,
  VersionMetadataSchema,
  sha256,
  sha512,
  toHashDigest,
  toPosixPath,
  normalizePackageName,
} from '@prism/shared'
import { normalizeExportPath } from '@prism/shared'
import type { PrismManifest } from '@prism/core'
import {
  analyzeExports,
  analyzeFileTree,
  analyzeRuntime,
  analyzeSizes,
  summarizeManifest,
} from '../analyzers'
import { inspectTarball } from './tarballInspector'
import type { TarballFileEntry } from './tarballInspector'
import { packageRepository } from '../repositories/packageRepository'
import { searchIndexService } from '../services/searchIndexService'
import { tarballPath, storagePaths } from '../storage/storageLayout'
import { getPrismStorage } from '../storage/storageFactory'
import { isValidUrl } from '../utils/url'

const parseBugsField = (bugs: unknown) => {
  if (!bugs) return undefined
  if (typeof bugs === 'string' && isValidUrl(bugs)) {
    return { url: bugs }
  }
  if (typeof bugs === 'object' && bugs) {
    const record = bugs as { url?: string; email?: string }
    if (record.url && isValidUrl(record.url)) {
      return { url: record.url, email: record.email }
    }
  }
  return undefined
}

const determineTags = (
  manifest: ReturnType<typeof summarizeManifest>['manifest'],
  runtimeTags: string[],
  distributionBytes: number,
) => {
  const tags = new Set(runtimeTags as string[])
  const dependencyCount = Object.keys(manifest.dependencies ?? {}).length
  if (dependencyCount === 0) tags.add('zero-deps')
  if (distributionBytes <= 5 * 1024) tags.add('tiny')
  if ((manifest.types || manifest.typings) && !tags.has('typed'))
    tags.add('typed')
  if (!tags.has('stable')) tags.add('stable')
  return Array.from(tags)
}

const computeMaturityScore = (manifestVersion: string) => {
  const major = Number(manifestVersion.split('.')[0]) || 0
  return Math.max(30, Math.min(95, 40 + major * 5))
}

const normalizeRepository = (repository: PackageManifest['repository']) => {
  if (!repository) return undefined
  if (typeof repository === 'string') {
    return { type: 'git', url: repository }
  }
  return repository
}

// use centralized export path normalizer from @prism/shared

const buildExportsRecord = (
  manifest: PackageManifest,
): Record<string, string> | undefined => {
  const record: Record<string, string> = {}
  const register = (key: string, target?: unknown) => {
    if (typeof target !== 'string' || record[key]) {
      return
    }
    const normalized = normalizeExportPath(target)
    if (normalized.length > 0) {
      record[key] = normalized
    }
  }

  const exportsField = manifest.exports
  if (!exportsField) {
    return undefined
  }

  if (typeof exportsField === 'string') {
    register('.', exportsField)
  } else if (typeof exportsField === 'object') {
    for (const [key, value] of Object.entries(
      exportsField as Record<string, unknown>,
    )) {
      if (typeof value === 'string') {
        register(key, value)
        continue
      }
      if (value && typeof value === 'object') {
        const entry = value as Record<string, unknown>
        register(key, entry.default ?? entry.import)
        for (const [conditional, conditionalValue] of Object.entries(entry)) {
          register(conditional, conditionalValue)
        }
      }
    }
  }

  return Object.keys(record).length ? record : undefined
}

const buildPrismManifest = (
  manifestSummary: ReturnType<typeof summarizeManifest>,
  files: TarballFileEntry[],
  runtime: ReturnType<typeof analyzeRuntime>,
  tarballBuffer: Buffer,
): PrismManifest => {
  const fileList = files.map((entry) => entry.path)
  return {
    name: manifestSummary.identifier.name,
    version: manifestSummary.identifier.version,
    files: fileList,
    integrity: `sha512-${sha512(tarballBuffer)}`,
    types: manifestSummary.manifest.types ?? manifestSummary.manifest.typings,
    exports: buildExportsRecord(manifestSummary.manifest),
    runtimes: {
      node: runtime.compatibility.node,
      bun: runtime.compatibility.bun,
      deno: runtime.compatibility.deno,
    },
    metadata: {
      description: manifestSummary.manifest.description,
      keywords: manifestSummary.manifest.keywords ?? [],
      license: manifestSummary.manifest.license,
      repository: normalizeRepository(manifestSummary.manifest.repository),
    },
  }
}

interface PublishPipelineOptions {
  expectedName?: string
}

export const runPublishPipeline = async (
  payload: PublishPayload,
  options?: PublishPipelineOptions,
) => {
  const tarballBuffer = Buffer.from(payload.tarballBase64, 'base64')
  const digest = sha256(tarballBuffer)
  if (digest !== payload.sha256.toLowerCase()) {
    throw new Error('sha256 mismatch')
  }

  const inspection = await inspectTarball(tarballBuffer)
  const manifestSummary = summarizeManifest(inspection.manifest)

  if (options?.expectedName) {
    const expected = normalizePackageName(options.expectedName)
    const actual = normalizePackageName(manifestSummary.identifier.name)
    if (expected !== actual) {
      throw new Error(
        `Package name mismatch. Received "${options.expectedName}" but tarball declares "${manifestSummary.identifier.name}"`,
      )
    }
  }
  const runtime = analyzeRuntime(manifestSummary.manifest)
  const exportsMap = analyzeExports(manifestSummary.manifest)
  const fileTree = analyzeFileTree(inspection.files, inspection.generatedAt)
  const distribution = analyzeSizes(inspection.files)
  const tags = determineTags(
    manifestSummary.manifest,
    runtime.tags,
    distribution.rawBytes,
  )
  const prismManifest = buildPrismManifest(
    manifestSummary,
    inspection.files,
    runtime,
    tarballBuffer,
  )

  const identifier = manifestSummary.identifier
  const relativeTarballPath = path.relative(
    storagePaths.root,
    tarballPath(identifier.name, identifier.version),
  )

  const metadata = VersionMetadataSchema.parse({
    identifier,
    description: manifestSummary.manifest.description,
    keywords: manifestSummary.keywords,
    license: manifestSummary.license,
    repository: normalizeRepository(manifestSummary.manifest.repository),
    homepage: isValidUrl(manifestSummary.manifest.homepage)
      ? manifestSummary.manifest.homepage
      : undefined,
    author: manifestSummary.manifest.author,
    bugs: parseBugsField(manifestSummary.manifest.bugs),
    checksum: toHashDigest(digest),
    dist: {
      tarball: relativeTarballPath,
      integrity: `sha256-${digest}`,
      fileName: `${identifier.name}-${identifier.version}.tgz`,
    },
    files: fileTree.snapshot,
    distribution,
    sizeByDirectory: fileTree.sizeByDirectory,
    dependencies: manifestSummary.manifest.dependencies ?? {},
    devDependencies: manifestSummary.manifest.devDependencies ?? {},
    peerDependencies: manifestSummary.manifest.peerDependencies ?? {},
    optionalDependencies: manifestSummary.manifest.optionalDependencies ?? {},
    exports: exportsMap,
    runtime,
    tags,
    release: {
      publishedAt: new Date().toISOString(),
      maturityScore: computeMaturityScore(identifier.version),
      previousVersion: undefined,
      releaseFrequencyDays: undefined,
    },
  })

  await packageRepository.saveVersion(metadata, tarballBuffer)
  await getPrismStorage().putManifest(prismManifest)
  await searchIndexService.upsert(metadata)

  // Update dist-tags: set/update "latest" to max version
  try {
    const allVersions = await packageRepository.listVersions(identifier.name)
    const latest = allVersions[allVersions.length - 1]
    if (latest) {
      await packageRepository.setDistTag(identifier.name, 'latest', latest)
    }
  } catch {
    // non-fatal; tag update should not break publish
  }

  return PublishResponseSchema.parse({
    identifier: metadata.identifier,
    metadata,
  })
}
