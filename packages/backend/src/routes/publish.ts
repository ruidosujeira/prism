import { FastifyInstance } from 'fastify'
import { PublishPayloadSchema } from '@prism/shared'
import { publishService } from '../services/publishService'

export const registerPublishRoute = (app: FastifyInstance) => {
  app.post<{ Body: unknown }>('/publish', async (request, reply) => {
    const payload = PublishPayloadSchema.parse(request.body)
    const response = await publishService.publish(payload)
    reply.code(201).send(response)
  })
}
