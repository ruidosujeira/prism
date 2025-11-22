import type { FastifyInstance } from 'fastify'
import { packageRepository } from '../repositories/packageRepository'
import { getPrismStorage, tarballPath } from '../storage'
import fs from 'node:fs'

const buildTarballUrl = (request: any, name: string, version: string) => {
  const host = `${request.protocol}://${request.headers.host ?? request.hostname}`
  // npm-style path under compat layer
  return `${host}/${encodeURIComponent(name)}/-/${encodeURIComponent(
    `${name}-${version}.tgz`,
  )}`
}

const toNpmVersionDoc = (
  manifest: any,
  metadata: any,
  tarballUrl: string,
) => {
  // Minimal npm-like doc
  return {
    name: manifest.name,
    version: manifest.version,
    description: metadata.description,
    license: metadata.license,
    repository: metadata.repository,
    homepage: metadata.homepage,
    keywords: metadata.keywords,
    author: metadata.author,
    bugs: metadata.bugs,
    main: manifest.exports?.['.'] ?? manifest.exports?.default,
    types: manifest.types,
    exports: manifest.exports,
    dependencies: metadata.dependencies ?? {},
    devDependencies: metadata.devDependencies ?? {},
    peerDependencies: metadata.peerDependencies ?? {},
    optionalDependencies: metadata.optionalDependencies ?? {},
    dist: {
      tarball: tarballUrl,
      integrity: metadata.dist.integrity,
      fileCount: metadata.files?.totalFiles,
      unpackedSize: metadata.distribution?.rawBytes,
    },
    _id: `${manifest.name}@${manifest.version}`,
  }
}

export const registerNpmCompatRouter = (app: FastifyInstance) => {
  // Auth hook placeholder (no-op by default)
  const auth = async () => {}

  // GET /:package
  app.get<{ Params: { package: string } }>(
    '/:package',
    { preHandler: auth },
    async (request, reply) => {
      const name = request.params.package
      const index = await packageRepository.getPackageIndex(name)
      if (!index) return reply.code(404).send({ error: 'not_found' })

      const versions: Record<string, any> = {}
      const times: Record<string, string> = {}
      for (const v of index.versions) {
        const md = await packageRepository.getVersion(name, v)
        if (!md) continue
        const manifest = await getPrismStorage().getManifest(name, v)
        const tarball = buildTarballUrl(request, name, v)
        versions[v] = toNpmVersionDoc(manifest, md, tarball)
        times[v] = md.release.publishedAt
      }

      const tags = await packageRepository.getDistTags(name)

      const body = {
        _id: name,
        name,
        'dist-tags': { latest: index.latest, ...tags },
        versions,
        time: {
          created: times[index.versions[0]] ?? times[index.latest],
          modified: times[index.latest],
          ...times,
        },
        description: versions[index.latest]?.description,
        license: versions[index.latest]?.license,
        repository: versions[index.latest]?.repository,
        readme: undefined as string | undefined, // optional; can be added later
      }

      reply.send(body)
    },
  )

  // GET /:package/:version
  app.get<{ Params: { package: string; version: string } }>(
    '/:package/:version',
    { preHandler: auth },
    async (request, reply) => {
      const { package: name, version } = request.params
      const md = await packageRepository.getVersion(name, version)
      if (!md) return reply.code(404).send({ error: 'not_found' })
      const manifest = await getPrismStorage().getManifest(name, version)
      const tarball = buildTarballUrl(request, name, version)
      reply.send(toNpmVersionDoc(manifest, md, tarball))
    },
  )

  // GET /:package/-/:tarball
  app.get<{ Params: { package: string; tarball: string } }>(
    '/:package/-/:tarball',
    { preHandler: auth },
    async (request, reply) => {
      const { package: name, tarball } = request.params
      // Expect name-version.tgz
      const match = tarball.match(/^(.*)-(\d+\.\d+\.\d+)(?:[^]*)\.tgz$/)
      const version = match?.[2]
      if (!version) {
        return reply.code(400).send({ error: 'bad_tarball_name' })
      }
      const stream = fs.createReadStream(tarballPath(name, version))
      stream.on('error', () => reply.code(404).send({ error: 'not_found' }))
      reply.header('Content-Type', 'application/gzip')
      reply.header(
        'Content-Disposition',
        `attachment; filename="${name}-${version}.tgz"`,
      )
      return reply.send(stream)
    },
  )

  // PUT /-/package/:name/dist-tags/:tag
  app.put<{ Params: { name: string; tag: string }; Body: { version: string } }>(
    '/-/package/:name/dist-tags/:tag',
    { preHandler: auth },
    async (request, reply) => {
      const { name, tag } = request.params
      const body = request.body
      if (!body?.version) return reply.code(400).send({ error: 'version_required' })
      const versions = await packageRepository.listVersions(name)
      if (!versions.includes(body.version)) {
        return reply.code(400).send({ error: 'unknown_version' })
      }
      const tags = await packageRepository.setDistTag(name, tag, body.version)
      reply.send({ name, 'dist-tags': tags })
    },
  )
}
