import { z } from 'zod'
import {
  AnalyzerTagSchema,
  DirectorySizeBreakdownSchema,
  DistributionStatsSchema,
  ExportsMapSchema,
  RuntimeAnalysisSchema,
} from './analysis'
import { FileTreeSchema } from './fileTree'
import {
  HashSchema,
  PackageIdentifierSchema,
  PackageNameSchema,
  SemverSchema,
} from './identifiers'

export const DependencyMapSchema = z
  .record(z.string().regex(/^[0-9a-zA-Z.*^~><= -]+$/))
  .default({})

const RepositoryObjectSchema = z
  .object({
    type: z.string().default('git'),
    url: z.string(),
    directory: z.string().optional(),
  })
  .optional()

const AuthorSchema = z
  .union([
    z.string(),
    z.object({
      name: z.string(),
      email: z.string().email().optional(),
      url: z.string().url().optional(),
    }),
  ])
  .optional()

export const PackageManifestSchema = z
  .object({
    name: PackageNameSchema,
    version: SemverSchema,
    description: z.string().optional(),
    keywords: z.array(z.string()).optional(),
    license: z.string().optional(),
    repository: z.union([RepositoryObjectSchema, z.string()]).optional(),
    homepage: z.string().optional(),
    author: AuthorSchema,
    bugs: z
      .object({ url: z.string().optional(), email: z.string().optional() })
      .optional(),
    dependencies: DependencyMapSchema.optional(),
    devDependencies: DependencyMapSchema.optional(),
    peerDependencies: DependencyMapSchema.optional(),
    optionalDependencies: DependencyMapSchema.optional(),
    exports: z.unknown().optional(),
    main: z.string().optional(),
    module: z.string().optional(),
    types: z.string().optional(),
    typings: z.string().optional(),
    files: z.array(z.string()).optional(),
    type: z.enum(['module', 'commonjs']).optional(),
    engines: z.record(z.string()).optional(),
  })
  .passthrough()

const DistFileSchema = z.object({
  tarball: z.string().min(1),
  integrity: z.string(),
  fileName: z.string(),
})

const ReleaseStatsSchema = z.object({
  publishedAt: z.string().datetime(),
  maturityScore: z.number().min(0).max(100),
  releaseFrequencyDays: z.number().nonnegative().optional(),
  previousVersion: SemverSchema.optional(),
})

export const FileTreeSnapshotSchema = z.object({
  generatedAt: z.string().datetime(),
  totalFiles: z.number().nonnegative(),
  totalDirectories: z.number().nonnegative(),
  tree: FileTreeSchema,
})

export const VersionMetadataSchema = z.object({
  identifier: PackageIdentifierSchema,
  description: z.string().optional(),
  keywords: z.array(z.string()).default([]),
  license: z.string().optional(),
  repository: RepositoryObjectSchema,
  homepage: z.string().url().optional(),
  author: AuthorSchema,
  bugs: z
    .object({ url: z.string().url(), email: z.string().email().optional() })
    .optional(),
  checksum: HashSchema,
  dist: DistFileSchema,
  files: FileTreeSnapshotSchema.optional(),
  distribution: DistributionStatsSchema,
  sizeByDirectory: DirectorySizeBreakdownSchema.optional(),
  dependencies: DependencyMapSchema,
  devDependencies: DependencyMapSchema,
  peerDependencies: DependencyMapSchema,
  optionalDependencies: DependencyMapSchema,
  exports: ExportsMapSchema,
  runtime: RuntimeAnalysisSchema,
  tags: z.array(AnalyzerTagSchema),
  release: ReleaseStatsSchema,
})

export const PackageIndexEntrySchema = z.object({
  name: PackageNameSchema,
  latest: SemverSchema,
  versions: z.array(SemverSchema).min(1),
  tags: z.array(AnalyzerTagSchema),
})

export type PackageManifest = z.infer<typeof PackageManifestSchema>
export type FileTreeSnapshot = z.infer<typeof FileTreeSnapshotSchema>
export type VersionMetadata = z.infer<typeof VersionMetadataSchema>
export type PackageIndexEntry = z.infer<typeof PackageIndexEntrySchema>
