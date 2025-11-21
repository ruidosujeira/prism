/// <reference types="vitest" />
import { describe, expect, it } from 'vitest'
import {
  attachProvenance,
  computeProvenance,
  verifyProvenance,
} from '../src/utils/provenance'

const manifest = {
  name: 'demo-pkg',
  version: '1.0.0',
}

const tarball = Buffer.from('demo-tarball-bytes')

describe('provenance helpers', () => {
  it('computes manifest and tarball hashes', () => {
    const record = computeProvenance(manifest, tarball)
    expect(record.manifest.sha256).toHaveLength(64)
    expect(record.tarball.sha512).toHaveLength(128)
  })

  it('attaches provenance data to metadata payloads', () => {
    const record = computeProvenance(manifest, tarball)
    const enriched = attachProvenance(
      { metadata: { tags: ['stable'] } },
      record,
    )
    expect(enriched.metadata.provenance).toEqual(record)
    expect(enriched.metadata.tags).toEqual(['stable'])
  })

  it('verifies immutability of manifest and tarball', () => {
    const record = computeProvenance(manifest, tarball)
    expect(verifyProvenance(manifest, tarball, record)).toBe(true)
    expect(
      verifyProvenance({ ...manifest, version: '1.0.1' }, tarball, record),
    ).toBe(false)
    expect(verifyProvenance(manifest, Buffer.from('mutated'), record)).toBe(
      false,
    )
  })
})
