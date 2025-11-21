import { sha256, sha512 } from './hash'

export interface ProvenanceRecord {
  manifest: {
    sha256: string
    sha512: string
  }
  tarball: {
    sha256: string
    sha512: string
  }
}

const serializeManifest = (manifest: unknown): string =>
  typeof manifest === 'string' ? manifest : JSON.stringify(manifest)

export const computeProvenance = (
  manifest: unknown,
  tarball: Buffer | Uint8Array | string,
): ProvenanceRecord => {
  const manifestPayload = serializeManifest(manifest)
  const manifestSha256 = sha256(manifestPayload)
  const manifestSha512 = sha512(manifestPayload)
  const tarballSha256 = sha256(tarball)
  const tarballSha512 = sha512(tarball)

  return {
    manifest: {
      sha256: manifestSha256,
      sha512: manifestSha512,
    },
    tarball: {
      sha256: tarballSha256,
      sha512: tarballSha512,
    },
  }
}

export const attachProvenance = <
  T extends { metadata?: Record<string, unknown> },
>(
  target: T,
  provenance: ProvenanceRecord,
): T & {
  metadata: Record<string, unknown> & { provenance: ProvenanceRecord }
} => {
  const metadata = { ...(target.metadata ?? {}), provenance }
  return {
    ...target,
    metadata,
  }
}

export const verifyProvenance = (
  manifest: unknown,
  tarball: Buffer | Uint8Array | string,
  record: ProvenanceRecord,
): boolean => {
  const next = computeProvenance(manifest, tarball)
  return (
    next.manifest.sha256 === record.manifest.sha256 &&
    next.manifest.sha512 === record.manifest.sha512 &&
    next.tarball.sha256 === record.tarball.sha256 &&
    next.tarball.sha512 === record.tarball.sha512
  )
}
