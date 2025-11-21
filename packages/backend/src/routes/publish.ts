import { FastifyInstance } from 'fastify'
import { PublishPayloadSchema } from '@prism/shared'
import { publishService } from '../services/publishService'

export const registerPublishRoute = (app: FastifyInstance) => {
  app.post<{ Params: { name: string }; Body: unknown }>(
    '/v1/packages/:name',
    async (request, reply) => {
      const payload = PublishPayloadSchema.parse(request.body)
      const response = await publishService.publish(
        request.params.name,
        payload,
      )
      reply.code(201).send(response)
    },
  )
}
