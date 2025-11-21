import { FastifyInstance } from 'fastify'
import { diffService } from '../services/diffService'
import { packageRepository } from '../repositories/packageRepository'

export const registerPackageRoutes = (app: FastifyInstance) => {
  app.get<{ Params: { name: string } }>(
    '/package/:name',
    async (request, reply) => {
      const { name } = request.params
      const summary = await packageRepository.getPackageIndex(name)
      if (!summary) {
        reply.code(404).send({ message: 'package not found' })
        return
      }
      reply.send(summary)
    },
  )

  app.get<{ Params: { name: string; version: string } }>(
    '/package/:name/:version',
    async (request, reply) => {
      const { name, version } = request.params
      const metadata = await packageRepository.getVersion(name, version)
      if (!metadata) {
        reply.code(404).send({ message: 'version not found' })
        return
      }
      reply.send(metadata)
    },
  )

  app.get<{ Params: { name: string; version: string } }>(
    '/package/:name/:version/files',
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
    '/package/:name/:version/diff/:previous',
    async (request, reply) => {
      const { name, version, previous } = request.params
      const diff = await diffService.diff(name, previous, version)
      reply.send(diff)
    },
  )
}
