import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import tar from 'tar'
import { Command } from 'commander'
import { PublishResponseSchema } from '@prism/shared'
import type { CliContext } from '../index'

const IGNORED_PATHS = [
  'node_modules',
  'dist',
  'build',
  '.git',
  '.turbo',
  '.next',
]

type PrismConfig = {
  publisher?: {
    name: string
    email?: string
  }
}

const loadJsonFile = async <T>(filePath: string): Promise<T | null> => {
  try {
    const raw = await fs.readFile(filePath, 'utf8')
    return JSON.parse(raw) as T
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null
    }
    throw error
  }
}

const loadPackageManifest = async (dir: string) => {
  const manifest = await loadJsonFile<Record<string, unknown>>(
    path.join(dir, 'package.json'),
  )
  if (!manifest || typeof manifest.name !== 'string') {
    throw new Error('package.json is missing a "name" field')
  }
  if (typeof manifest.version !== 'string') {
    throw new Error('package.json is missing a "version" field')
  }
  return manifest as { name: string; version: string; author?: unknown }
}

const loadPrismConfig = async (dir: string): Promise<PrismConfig> => {
  const config = await loadJsonFile<PrismConfig>(path.join(dir, 'prism.json'))
  return config ?? {}
}

const inferPublisher = (
  manifest: { author?: unknown },
  config: PrismConfig,
): { name: string; email?: string } => {
  if (config.publisher?.name) {
    return config.publisher
  }

  if (process.env.PRISM_PUBLISHER_NAME) {
    return {
      name: process.env.PRISM_PUBLISHER_NAME,
      email: process.env.PRISM_PUBLISHER_EMAIL,
    }
  }

  if (typeof manifest.author === 'string' && manifest.author.trim()) {
    return { name: manifest.author.trim() }
  }

  if (
    manifest.author &&
    typeof manifest.author === 'object' &&
    'name' in manifest.author &&
    typeof (manifest.author as { name?: unknown }).name === 'string'
  ) {
    const data = manifest.author as { name?: string; email?: string }
    return {
      name: data.name ?? 'anonymous',
      email: data.email,
    }
  }

  return { name: 'anonymous' }
}

const shouldInclude = (filePath: string) => {
  const normalized = filePath.replace(/^\.\/+/, '')
  return !IGNORED_PATHS.some((segment) => {
    return (
      normalized === segment ||
      normalized.startsWith(`${segment}/`) ||
      normalized.includes(`/${segment}/`) ||
      normalized.endsWith(`/${segment}`)
    )
  })
}

const createTarball = async (dir: string): Promise<Buffer> => {
  const chunks: Buffer[] = []
  const archive = tar.c(
    {
      gzip: true,
      cwd: dir,
      noMtime: true,
      portable: true,
      filter: shouldInclude,
    },
    ['.'],
  )

  for await (const chunk of archive) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }

  return Buffer.concat(chunks)
}

const postJson = async (url: string, payload: unknown) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Registry responded with ${response.status}: ${text}`)
  }
  return response
}

export const registerPublishCommand = (
  program: Command,
  context: CliContext,
) => {
  program
    .command('publish')
    .description('Publish the current project to the Prism registry')
    .option('-d, --dir <path>', 'Project directory', '.')
    .action(async (options: { dir?: string }) => {
      const projectDir = path.resolve(options.dir ?? '.')
      const manifest = await loadPackageManifest(projectDir)
      const config = await loadPrismConfig(projectDir)
      const publisher = inferPublisher(manifest, config)

      const tarball = await createTarball(projectDir)
      const sha256 = crypto.createHash('sha256').update(tarball).digest('hex')
      const payload = {
        tarballBase64: tarball.toString('base64'),
        sha256,
        publisher,
        source: 'cli' as const,
      }

      const target = new URL(
        `/v1/packages/${encodeURIComponent(manifest.name)}`,
        context.registryUrl,
      )

      const response = await postJson(target.toString(), payload)
      const parsed = PublishResponseSchema.parse(await response.json())
      console.log(
        `Published ${parsed.identifier.name}@${parsed.identifier.version}`,
      )
    })
}
