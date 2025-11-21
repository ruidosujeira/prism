import path from 'node:path'
import type { PackageManifest } from '@prism/shared'
import {
  PublishPayload,
  PublishResponseSchema,
  VersionMetadataSchema,
  sha256,
  toHashDigest,
} from '@prism/shared'
import {
  analyzeExports,
  analyzeFileTree,
  analyzeRuntime,
  analyzeSizes,
  summarizeManifest,
} from '../analyzers'
import { inspectTarball } from './tarballInspector'
import { packageRepository } from '../repositories/packageRepository'
import { searchIndexService } from '../services/searchIndexService'
import { tarballPath, storagePaths } from '../storage/storageLayout'
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

export const runPublishPipeline = async (payload: PublishPayload) => {
  const tarballBuffer = Buffer.from(payload.tarballBase64, 'base64')
  const digest = sha256(tarballBuffer)
  if (digest !== payload.sha256.toLowerCase()) {
    throw new Error('sha256 mismatch')
  }

  const inspection = await inspectTarball(tarballBuffer)
  const manifestSummary = summarizeManifest(inspection.manifest)
  const runtime = analyzeRuntime(manifestSummary.manifest)
  const exportsMap = analyzeExports(manifestSummary.manifest)
  const fileTree = analyzeFileTree(inspection.files, inspection.generatedAt)
  const distribution = analyzeSizes(inspection.files)
  const tags = determineTags(
    manifestSummary.manifest,
    runtime.tags,
    distribution.rawBytes,
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
  await searchIndexService.upsert(metadata)

  return PublishResponseSchema.parse({
    identifier: metadata.identifier,
    metadata,
  })
}
