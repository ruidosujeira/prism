import { z } from 'zod'
import { DirectorySizeBreakdownSchema, ExportEntrySchema } from './analysis'
import { PackageIdentifierSchema } from './identifiers'

const ChangedFileSchema = z.object({
  path: z.string(),
  change: z.enum(['added', 'removed', 'modified']),
  before: z
    .object({
      rawBytes: z.number().nonnegative(),
      gzipBytes: z.number().nonnegative(),
    })
    .optional(),
  after: z
    .object({
      rawBytes: z.number().nonnegative(),
      gzipBytes: z.number().nonnegative(),
    })
    .optional(),
})

const DependencyDeltaSchema = z.object({
  name: z.string(),
  before: z.string().optional(),
  after: z.string().optional(),
})

export const VersionDiffSchema = z.object({
  from: PackageIdentifierSchema,
  to: PackageIdentifierSchema,
  files: z.array(ChangedFileSchema),
  exports: z.object({
    added: z.array(ExportEntrySchema),
    removed: z.array(ExportEntrySchema),
  }),
  dependencies: z.array(DependencyDeltaSchema),
  sizeByDirectory: z.object({
    before: DirectorySizeBreakdownSchema,
    after: DirectorySizeBreakdownSchema,
  }),
})

export type VersionDiff = z.infer<typeof VersionDiffSchema>
