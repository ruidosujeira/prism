import type { PrismManifest } from '../manifest'
import { isValidPrismManifest } from '../manifest'
import type { PrismStorage } from '../storage'
import type { PrismArtifact } from '../domain/artifact'
import type { PublishRequest, PublishResult } from '../domain/requests'

// Stage IO contracts
export interface UploadInput {
  req: PublishRequest
}

export interface UploadOutput {
  // For now we keep bytes in memory; real impls should stream to storage.
  bytes: Uint8Array
  filename: string
  size: number
  contentType?: string
}

export interface ValidateOutput extends UploadOutput {}

export interface ExtractOutput {
  // Extracted tar entries (path -> bytes). Real impls should stream.
  files: Record<string, Uint8Array>
}

export interface ParseManifestOutput {
  manifest: PrismManifest
}

export interface GenerateMetadataOutput {
  manifest: PrismManifest
  artifact: PrismArtifact
  createdAt: string
  tags: string[]
}

export interface PersistOutput extends GenerateMetadataOutput {}

export interface IndexOutput extends PersistOutput {}

// Pipeline stages
export type PublishStage<TIn, TOut> = (input: TIn) => Promise<TOut>

export const upload: PublishStage<UploadInput, UploadOutput> = async ({ req }) => {
  // TODO(storage): Implement streaming upload directly to object storage.
  if (!req.bytes) {
    throw new Error('PublishRequest.bytes must be provided for in-memory pipeline.')
  }
  return {
    bytes: req.bytes,
    filename: req.filename,
    size: req.size,
    contentType: req.contentType,
  }
}

export const validate: PublishStage<UploadOutput, ValidateOutput> = async (input) => {
  // TODO(security): Validate content type, size limits, quarantine scanning.
  if (input.size !== input.bytes.byteLength) {
    throw new Error('Uploaded size does not match bytes length.')
  }
  return input
}

export const extract: PublishStage<ValidateOutput, ExtractOutput> = async (input) => {
  // TODO(archive): Implement tarball extraction; for now assume single file manifest.json.
  return { files: { 'manifest.json': input.bytes } }
}

export const parseManifest: PublishStage<ExtractOutput, ParseManifestOutput> = async ({ files }) => {
  const manifestBytes = files['manifest.json']
  if (!manifestBytes) {
    throw new Error('manifest.json not found in archive.')
  }
  const text = new TextDecoder().decode(manifestBytes)
  const parsed = JSON.parse(text)
  if (!isValidPrismManifest(parsed)) {
    throw new Error('Invalid Prism manifest.')
  }
  return { manifest: parsed }
}

export const generateMetadata: PublishStage<ParseManifestOutput, GenerateMetadataOutput> = async ({ manifest }) => {
  // TODO(integrity): Compute integrity from tarball contents, not just manifest.
  const artifact: PrismArtifact = {
    integrity: manifest.integrity,
    size: manifest.files.length, // placeholder until tar size known
    key: `${manifest.name}/${manifest.version}/package.tgz`,
    filename: `${manifest.name}-${manifest.version}.tgz`,
  }
  return {
    manifest,
    artifact,
    createdAt: new Date().toISOString(),
    tags: ['latest'], // TODO: compute semantic tags
  }
}

export const persist: (storage: PrismStorage) => PublishStage<GenerateMetadataOutput, PersistOutput> =
  (storage) => async (output) => {
    // TODO(storage): Persist tarball and manifest. Only manifest for now.
    await storage.putManifest(output.manifest)
    return output
  }

export const index: PublishStage<PersistOutput, IndexOutput> = async (output) => {
  // TODO(index): Update package indices and tag pointers.
  return output
}

export async function runPublishPipeline(
  req: PublishRequest,
  storage: PrismStorage,
): Promise<PublishResult> {
  // Compose the pipeline
  const up = await upload({ req })
  const val = await validate(up)
  const ext = await extract(val)
  const parsed = await parseManifest(ext)
  const meta = await generateMetadata(parsed)
  const persisted = await persist(storage)(meta)
  const final = await index(persisted)
  return {
    name: final.manifest.name,
    version: final.manifest.version,
    artifact: final.artifact,
    manifest: final.manifest,
    createdAt: final.createdAt,
    tags: final.tags,
  }
}
