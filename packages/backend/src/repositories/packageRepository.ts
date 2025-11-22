import fs from 'node:fs/promises'
import type { Dirent } from 'node:fs'
import {
  PackageIndexEntry,
  PackageIndexEntrySchema,
  VersionMetadata,
  VersionMetadataSchema,
} from '@prism/shared'
import { ensureDir, readJson, writeJson } from '../utils/fs'
import {
  metadataPath,
  resolvePackageDir,
  resolveVersionDir,
  storagePaths,
  tarballPath,
} from '../storage/storageLayout'
import { sortVersionsAsc } from '../utils/semver'
import path from 'node:path'
import { distTagsPath } from '../storage'

export class PackageRepository {
  async saveVersion(metadata: VersionMetadata, tarball: Buffer) {
    const { name, version } = metadata.identifier
    const versionDir = resolveVersionDir(name, version)
    await ensureDir(versionDir)
    await fs.writeFile(tarballPath(name, version), tarball)
    await writeJson(metadataPath(name, version), metadata)
  }

  async getVersion(name: string, version: string) {
    const payload = await readJson<VersionMetadata>(metadataPath(name, version))
    return payload ? VersionMetadataSchema.parse(payload) : null
  }

  async listVersions(name: string) {
    try {
      const dir = resolvePackageDir(name)
      const entries: Dirent[] = await fs.readdir(dir, { withFileTypes: true })
      const versions = entries
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
      return sortVersionsAsc(versions)
    } catch (error) {
      if ((error as NodeError).code === 'ENOENT') {
        return []
      }
      throw error
    }
  }

  async getPackageIndex(name: string): Promise<PackageIndexEntry | null> {
    const versions = await this.listVersions(name)
    if (!versions.length) return null
    const latest = versions[versions.length - 1]
    const latestMetadata = await this.getVersion(name, latest)
    if (!latestMetadata) return null
    const index: PackageIndexEntry = {
      name: latestMetadata.identifier.name,
      latest,
      versions,
      tags: latestMetadata.tags,
    }
    return PackageIndexEntrySchema.parse(index)
  }

  async listPackages(): Promise<PackageIndexEntry[]> {
    try {
      const entries = await fs.readdir(storagePaths.packagesRoot, {
        withFileTypes: true,
      })
      const summaries: PackageIndexEntry[] = []
      for (const entry of entries) {
        if (!entry.isDirectory()) {
          continue
        }
        const summary = await this.getPackageIndex(entry.name)
        if (summary) {
          summaries.push(summary)
        }
      }
      return summaries.sort((a, b) => a.name.localeCompare(b.name))
    } catch (error) {
      if ((error as NodeError).code === 'ENOENT') {
        return []
      }
      throw error
    }
  }

  // Dist-tags
  async getDistTags(name: string): Promise<Record<string, string>> {
    const payload = await readJson<Record<string, string>>(distTagsPath(name))
    return payload ?? {}
  }

  async setDistTag(
    name: string,
    tag: string,
    version: string,
  ): Promise<Record<string, string>> {
    await ensureDir(storagePaths.tagsRoot)
    const current = await this.getDistTags(name)
    current[tag] = version
    await writeJson(distTagsPath(name), current)
    return current
  }
}

type NodeError = Error & { code?: string }

export const packageRepository = new PackageRepository()
