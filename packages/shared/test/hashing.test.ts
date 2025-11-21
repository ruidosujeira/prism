/// <reference types="vitest" />
import { describe, expect, it } from 'vitest'
import { sha256, sha512, toHashDigest } from '../src/utils/hash'

describe('hash utilities', () => {
  it('produces deterministic digests for identical input', () => {
    const first = sha256('hello world')
    const second = sha256('hello world')
    expect(first).toBe(second)
    expect(first).toBe(
      'b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9',
    )
  })

  it('produces distinct digests for different inputs', () => {
    const left = sha256('left')
    const right = sha256('right')
    expect(left).not.toBe(right)
  })

  it('supports sha512 for larger payloads', () => {
    const digest = sha512('hello world')
    expect(digest).toBe(
      '309ecc489c12d6eb4cc40f50c902f2b4d0ed77ee511a7c7a9bcd3ca86d4cd86f989dd35bc5ff499670da34255b45b0cfd830e81f605dcf7dc5542e93ae9cd76f',
    )
  })

  it('normalizes hex casing via toHashDigest', () => {
    const digest = toHashDigest(
      'ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890',
    )
    expect(digest.algorithm).toBe('sha256')
    expect(digest.value).toBe(
      'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    )
  })
})
