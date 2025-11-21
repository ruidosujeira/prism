import path from 'node:path'
import { z } from 'zod'

const EnvSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  STORAGE_ROOT: z.string().default(path.join(process.cwd(), 'storage')),
})

export type Env = z.infer<typeof EnvSchema>

export const loadEnv = (): Env => {
  const parsed = EnvSchema.parse({
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    STORAGE_ROOT: process.env.STORAGE_ROOT,
  })
  return parsed
}

export const env = loadEnv()
