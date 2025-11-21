import { z } from 'zod'
import { PackageIdentifierSchema } from './identifiers'
import { VersionMetadataSchema } from './metadata'

export const PublishPayloadSchema = z.object({
  tarballBase64: z.string().min(1),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  publisher: z.object({
    name: z.string(),
    email: z.string().email().optional(),
  }),
  source: z.enum(['cli', 'api', 'web']).default('api'),
})

export const PublishResponseSchema = z.object({
  identifier: PackageIdentifierSchema,
  metadata: VersionMetadataSchema,
})

export type PublishPayload = z.infer<typeof PublishPayloadSchema>
export type PublishResponse = z.infer<typeof PublishResponseSchema>
