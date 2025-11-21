import { z } from 'zod'

export const RuntimeCompatibilitySchema = z.object({
  node: z.boolean(),
  bun: z.boolean(),
  deno: z.boolean(),
  workers: z.boolean(),
  notes: z.array(z.string()).default([]),
})

export const ModuleFormatSchema = z.enum(['esm', 'cjs', 'hybrid'])
export const TypePresenceSchema = z.enum(['bundled', 'types-field', 'none'])

export const AnalyzerTagSchema = z.enum([
  'zero-deps',
  'typed',
  'esm-only',
  'tiny',
  'runtime-safe',
  'stable',
  'experimental',
])

export const SizeMetricSchema = z.object({
  rawBytes: z.number().nonnegative(),
  gzipBytes: z.number().nonnegative(),
})

export const DistributionStatsSchema = SizeMetricSchema.extend({
  fileCount: z.number().nonnegative(),
  directoryCount: z.number().nonnegative(),
})

export const DirectorySizeBreakdownSchema = z.array(
  z.object({
    path: z.string(),
    size: SizeMetricSchema,
  }),
)

export const ExportConditionSchema = z.object({
  condition: z.string(),
  path: z.string(),
  format: ModuleFormatSchema.default('esm'),
  types: z.boolean().default(false),
})

export const ExportEntrySchema = z.object({
  name: z.string(),
  type: z.enum(['value', 'type']).default('value'),
  targets: z.array(ExportConditionSchema).min(1),
})

export const ExportsMapSchema = z.object({
  entries: z.array(ExportEntrySchema),
  hasExportMap: z.boolean(),
  inferredFormat: ModuleFormatSchema,
  types: TypePresenceSchema,
})

export const RuntimeAnalysisSchema = z.object({
  compatibility: RuntimeCompatibilitySchema,
  moduleFormat: ModuleFormatSchema,
  types: TypePresenceSchema,
  tags: z.array(AnalyzerTagSchema),
})

export type RuntimeCompatibility = z.infer<typeof RuntimeCompatibilitySchema>
export type ModuleFormat = z.infer<typeof ModuleFormatSchema>
export type AnalyzerTag = z.infer<typeof AnalyzerTagSchema>
export type ExportEntry = z.infer<typeof ExportEntrySchema>
export type ExportsMap = z.infer<typeof ExportsMapSchema>
