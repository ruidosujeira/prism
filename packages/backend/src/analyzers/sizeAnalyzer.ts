import { DistributionStatsSchema } from '@prism/shared'
import { TarballFileEntry } from '../ingest/tarballInspector'

export const analyzeSizes = (files: TarballFileEntry[]) => {
  const directorySet = new Set<string>()
  let rawBytes = 0
  let gzipBytes = 0

  files.forEach((file) => {
    rawBytes += file.size.rawBytes
    gzipBytes += file.size.gzipBytes
    file.segments.slice(0, -1).forEach((_, idx, segments) => {
      const segmentPath = segments.slice(0, idx + 1).join('/')
      if (segmentPath) {
        directorySet.add(segmentPath)
      }
    })
  })

  return DistributionStatsSchema.parse({
    rawBytes,
    gzipBytes,
    fileCount: files.length,
    directoryCount: directorySet.size,
  })
}
