import { FastifyInstance } from 'fastify'
import { diffService } from '../services/diffService'
import { packageRepository } from '../repositories/packageRepository'
import { getPrismStorage } from '../storage/storageFactory'
import { tarballPath } from '../storage/storageLayout'
import fs from 'node:fs'

export const registerPackageRoutes = (app: FastifyInstance) => {
  app.get('/v1/packages', async (_request, reply) => {
    const packages = await packageRepository.listPackages()
    reply.send(packages)
  })

  app.get<{ Params: { name: string } }>(
    '/v1/packages/:name',
    async (request, reply) => {
      const summary = await packageRepository.getPackageIndex(
        request.params.name,
      )
      if (!summary) {
        reply.code(404).send({ message: 'package not found' })
        return
      }
      reply.send(summary)
    },
  )

  // Explicit versions listing
  app.get<{ Params: { name: string } }>(
    '/v1/packages/:name/versions',
    async (request, reply) => {
      const versions = await packageRepository.listVersions(request.params.name)
      if (!versions.length) {
        reply.code(404).send({ message: 'package not found' })
        return
      }
      reply.send(versions)
    },
  )

  app.get<{ Params: { name: string; version: string } }>(
    '/v1/packages/:name/:version',
    async (request, reply) => {
      const { name, version } = request.params
      const metadata = await packageRepository.getVersion(name, version)
      if (!metadata) {
        reply.code(404).send({ message: 'version not found' })
        return
      }
      const manifest = await getPrismStorage().getManifest(name, version)
      reply.send({ metadata, manifest })
    },
  )

  // Tarball download
  app.get<{ Params: { name: string; version: string } }>(
    '/v1/packages/:name/:version.tgz',
    async (request, reply) => {
      const { name, version } = request.params
      const file = tarballPath(name, version)
      // stream the file
      const stream = fs.createReadStream(file)
      stream.on('error', () => {
        reply.code(404).send({ message: 'tarball not found' })
      })
      reply.header('Content-Type', 'application/gzip')
      reply.header(
        'Content-Disposition',
        `attachment; filename="${name}-${version}.tgz"`,
      )
      return reply.send(stream)
    },
  )

  app.get<{ Params: { name: string; version: string } }>(
    '/v1/packages/:name/:version/files',
    async (request, reply) => {
      const { name, version } = request.params
      const metadata = await packageRepository.getVersion(name, version)
      if (!metadata || !metadata.files) {
        reply.code(404).send({ message: 'file tree not found' })
        return
      }
      reply.send(metadata.files)
    },
  )

  app.get<{ Params: { name: string; version: string; previous: string } }>(
    '/v1/packages/:name/:version/diff/:previous',
    async (request, reply) => {
      const { name, version, previous } = request.params
      const diff = await diffService.diff(name, previous, version)
      reply.send(diff)
    },
  )
}
