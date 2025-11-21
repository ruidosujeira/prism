import path from 'node:path'
import { z } from 'zod'

const EnvSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  STORAGE_ROOT: z.string().default(path.join(process.cwd(), 'storage')),
  PUBLIC_BASE_URL: z.string().url().optional(),
  STORAGE_DRIVER: z.enum(['memory', 'filesystem', 's3']).default('memory'),
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_ENDPOINT: z.string().url().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
})

export type Env = z.infer<typeof EnvSchema>

export const loadEnv = (): Env => {
  const parsed = EnvSchema.parse({
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    STORAGE_ROOT: process.env.STORAGE_ROOT,
    PUBLIC_BASE_URL: process.env.PRISM_PUBLIC_BASE_URL,
    STORAGE_DRIVER: process.env.PRISM_STORAGE_DRIVER,
    S3_BUCKET: process.env.PRISM_S3_BUCKET,
    S3_REGION: process.env.PRISM_S3_REGION,
    S3_ENDPOINT: process.env.PRISM_S3_ENDPOINT,
    S3_ACCESS_KEY_ID: process.env.PRISM_S3_ACCESS_KEY_ID,
    S3_SECRET_ACCESS_KEY: process.env.PRISM_S3_SECRET_ACCESS_KEY,
  })

  if (parsed.STORAGE_DRIVER === 's3') {
    if (!parsed.S3_BUCKET || !parsed.S3_REGION) {
      throw new Error('S3 storage requires PRISM_S3_BUCKET and PRISM_S3_REGION')
    }
  }
  return parsed
}

export const env = loadEnv()
