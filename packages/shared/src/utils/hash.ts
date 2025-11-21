import { createHash } from 'node:crypto'
import { Buffer } from 'node:buffer'
import { HashSchema } from '../schemas/identifiers'

const toBuffer = (input: Buffer | Uint8Array | string): Buffer => {
  if (Buffer.isBuffer(input)) {
    return input
  }
  if (typeof input === 'string') {
    return Buffer.from(input)
  }
  return Buffer.from(input)
}

export const sha256 = (input: Buffer | Uint8Array | string): string =>
  createHash('sha256').update(toBuffer(input)).digest('hex')

export const sha512 = (input: Buffer | Uint8Array | string): string =>
  createHash('sha512').update(toBuffer(input)).digest('hex')

export const toHashDigest = (value: string) =>
  HashSchema.parse({
    algorithm: 'sha256',
    value: value.toLowerCase(),
  })
