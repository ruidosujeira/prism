import { createHash } from 'node:crypto'
import { Buffer } from 'node:buffer'
import { HashSchema } from '../schemas/identifiers'

export const sha256 = (input: Buffer | Uint8Array | string): string => {
  const buffer =
    typeof input === 'string'
      ? Buffer.from(input)
      : Buffer.isBuffer(input)
      ? input
      : Buffer.from(input)
  return createHash('sha256').update(buffer).digest('hex')
}

export const toHashDigest = (value: string) =>
  HashSchema.parse({
    algorithm: 'sha256',
    value: value.toLowerCase(),
  })
