import { z } from 'zod'
import type { PrismRuntime } from '../manifest'

// Shared primitives
export const runtimeEnum = z.enum(['node', 'deno', 'bun']) satisfies z.ZodType<PrismRuntime>
export const nameSchema = z.string().min(1).regex(/^@?[^\s/]+(?:\/[^\s/]+)?$/, 'invalid package name')
export const semverSchema = z.string().min(1)
export const isoDate = z.string().datetime({ offset: true })

// Domain fragments
export const artifactSchema = z.object({
  integrity: z.string().min(1),
  size: z.number().int().nonnegative(),
  key: z.string().min(1),
  filename: z.string().min(1).optional(),
})

export const manifestSchema = z.object({
  name: nameSchema,
  version: semverSchema,
  files: z.array(z.string()),
  integrity: z.string().min(1),
  types: z.string().optional(),
  exports: z.record(z.string()).optional(),
  runtimes: z
    .record(runtimeEnum, z.boolean().optional())
    .partial()
    .optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

// Endpoint: publish
export const publishRequestSchema = z.object({
  filename: z.string().min(1),
  size: z.number().int().nonnegative(),
  contentType: z.string().optional(),
  // Base64 for transport; servers may stream
  base64: z.string().min(1),
})

export const publishResponseSchema = z.object({
  name: nameSchema,
  version: semverSchema,
  artifact: artifactSchema,
  manifest: manifestSchema,
  createdAt: isoDate,
  tags: z.array(z.string()),
})

// Endpoint: version lookup
export const versionLookupParamsSchema = z.object({
  name: nameSchema,
})

export const versionLookupResponseSchema = z.object({
  name: nameSchema,
  versions: z.array(semverSchema),
  tags: z.record(z.string()).optional(),
})

// Endpoint: metadata (manifest by version)
export const metadataParamsSchema = z.object({
  name: nameSchema,
  version: semverSchema,
})

export const metadataResponseSchema = manifestSchema

// Endpoint: tarball retrieval
export const tarballParamsSchema = z.object({
  name: nameSchema,
  version: semverSchema,
})

export const tarballResponseSchema = z.object({
  // Signed URL or direct path; transport-specific
  url: z.string().url(),
  artifact: artifactSchema,
})

// Endpoint: package listing
export const listQuerySchema = z.object({
  q: z.string().optional(),
  limit: z.number().int().positive().max(100).default(20).optional(),
  cursor: z.string().optional(),
})

export const packageSummarySchema = z.object({
  name: nameSchema,
  description: z.string().optional(),
  homepage: z.string().url().optional(),
  keywords: z.array(z.string()).optional(),
  latestVersion: semverSchema.optional(),
})

export const listResponseSchema = z.object({
  items: z.array(packageSummarySchema),
  nextCursor: z.string().nullable().optional(),
})

// TODO: Add auth-related headers and error schemas when security model is defined.

export type PublishRequestBody = z.infer<typeof publishRequestSchema>
export type PublishResponseBody = z.infer<typeof publishResponseSchema>
export type VersionLookupResponseBody = z.infer<typeof versionLookupResponseSchema>
export type MetadataResponseBody = z.infer<typeof metadataResponseSchema>
export type TarballResponseBody = z.infer<typeof tarballResponseSchema>
export type ListResponseBody = z.infer<typeof listResponseSchema>
