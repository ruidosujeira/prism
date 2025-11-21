import {
  SearchDocumentSchema,
  SearchIndexSchema,
  VersionMetadata,
} from '@prism/shared'
import { searchIndexPath } from '../storage/storageLayout'
import { readJson, writeJson } from '../utils/fs'

const emptyIndex = () => ({
  generatedAt: new Date().toISOString(),
  documents: [] as ReturnType<typeof SearchDocumentSchema.parse>[],
})

type SearchIndex = ReturnType<typeof SearchIndexSchema.parse>

type SearchDocument = ReturnType<typeof SearchDocumentSchema.parse>

const buildScore = (metadata: VersionMetadata) => {
  const base = 0.5
  const typedBoost = metadata.runtime.types !== 'none' ? 0.1 : 0
  const zeroDepsBoost =
    metadata.dependencies && Object.keys(metadata.dependencies).length === 0
      ? 0.1
      : 0
  const maturityBoost = metadata.release.maturityScore / 1000
  return Math.min(1, base + typedBoost + zeroDepsBoost + maturityBoost)
}

const buildDocument = (metadata: VersionMetadata): SearchDocument =>
  SearchDocumentSchema.parse({
    identifier: metadata.identifier,
    description: metadata.description,
    keywords: metadata.keywords,
    tags: metadata.tags,
    runtime: metadata.runtime.compatibility,
    score: buildScore(metadata),
    stats: {},
  })

class SearchIndexService {
  private cache: SearchIndex | null = null

  private async load() {
    if (this.cache) return this.cache
    const payload = await readJson<SearchIndex>(searchIndexPath())
    this.cache = payload ?? emptyIndex()
    return this.cache
  }

  async upsert(metadata: VersionMetadata) {
    const index = await this.load()
    const doc = buildDocument(metadata)
    const existingIndex = index.documents.findIndex(
      (entry: SearchDocument) =>
        entry.identifier.name === metadata.identifier.name,
    )
    if (existingIndex >= 0) {
      index.documents[existingIndex] = doc
    } else {
      index.documents.push(doc)
    }
    index.generatedAt = new Date().toISOString()
    await writeJson(searchIndexPath(), index)
    this.cache = index
  }
}

export const searchIndexService = new SearchIndexService()
