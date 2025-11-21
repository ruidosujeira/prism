import { z } from 'zod'

export const PackageNameSchema = z
  .string()
  .min(1)
  .max(214)
  .regex(/^(?:@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/i, {
    message: 'invalid npm-style package name',
  })

export const SemverSchema = z
  .string()
  .regex(
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/,
    {
      message: 'invalid semver',
    },
  )

export const PackageIdentifierSchema = z.object({
  name: PackageNameSchema,
  version: SemverSchema,
})

export const HashSchema = z.object({
  algorithm: z.literal('sha256'),
  value: z.string().regex(/^[a-f0-9]{64}$/),
})

export const StoragePointerSchema = z.object({
  bucket: z.string().min(1),
  key: z.string().min(1),
  etag: z.string().optional(),
})

export type PackageName = z.infer<typeof PackageNameSchema>
export type Semver = z.infer<typeof SemverSchema>
export type PackageIdentifier = z.infer<typeof PackageIdentifierSchema>
export type HashDigest = z.infer<typeof HashSchema>
export type StoragePointer = z.infer<typeof StoragePointerSchema>
