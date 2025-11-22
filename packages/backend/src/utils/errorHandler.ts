import type { FastifyInstance, FastifyError, FastifyReply, FastifyRequest } from 'fastify'
import { ZodError } from 'zod'

export const registerErrorHandler = (app: FastifyInstance) => {
  app.setErrorHandler(async (err: FastifyError, _req: FastifyRequest, reply: FastifyReply) => {
    const isZod = err instanceof ZodError || err.name === 'ZodError'
    const status = isZod
      ? 400
      : typeof err.statusCode === 'number' && err.statusCode >= 400
      ? err.statusCode
      : 500
    const code = err.code || (status === 500 ? 'INTERNAL' : 'ERROR')

    if (status >= 500 && app.log?.error) {
      app.log.error({ err }, 'Unhandled error')
    }

    const message = isZod ? 'Invalid request payload' : err.message || 'Unexpected error'
    reply.code(status).send({
      error: {
        code,
        message,
      },
    })
  })
}
