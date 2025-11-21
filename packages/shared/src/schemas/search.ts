import { z } from 'zod'
import { AnalyzerTagSchema, RuntimeCompatibilitySchema } from './analysis'
import { PackageIdentifierSchema, PackageNameSchema } from './identifiers'

export const SearchDocumentSchema = z.object({
  identifier: PackageIdentifierSchema,
  description: z.string().optional(),
  keywords: z.array(z.string()).default([]),
  tags: z.array(AnalyzerTagSchema),
  runtime: RuntimeCompatibilitySchema,
  score: z.number().min(0).max(1),
  stats: z
    .object({
      downloads: z.number().nonnegative().optional(),
      dependents: z.number().nonnegative().optional(),
    })
    .partial(),
})

export const SearchIndexSchema = z.object({
  generatedAt: z.string().datetime(),
  documents: z.array(SearchDocumentSchema),
})

export const PackageSearchRequestSchema = z.object({
  query: z.string().default(''),
  filters: z
    .object({
      runtime: z.array(RuntimeCompatibilitySchema.keyof()).optional(),
      package: PackageNameSchema.optional(),
    })
    .default({}),
})

export type SearchDocument = z.infer<typeof SearchDocumentSchema>
