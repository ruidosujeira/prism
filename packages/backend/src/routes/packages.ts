import { FastifyInstance } from 'fastify'
import { diffService } from '../services/diffService'
import { packageRepository } from '../repositories/packageRepository'
import { getPrismStorage } from '../storage/storageFactory'

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
