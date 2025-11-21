import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import {
  EntryPointResolutionError,
  PackageNotFoundError,
  VersionNotFoundError,
  resolveSpec,
} from '@prism/core'
import { getPrismStorage } from '../storage/storageFactory'
import { env } from '../config/env'

const ResolveQuerySchema = z.object({
  spec: z.string().min(1),
  runtime: z.enum(['node', 'deno', 'bun']).default('node'),
  baseUrl: z.string().url().optional(),
})

type ResolveQuery = z.infer<typeof ResolveQuerySchema>

export const registerResolveRoute = (app: FastifyInstance) => {
  app.get<{ Querystring: ResolveQuery }>(
    '/v1/resolve',
    async (request, reply) => {
      const query = ResolveQuerySchema.parse(request.query)
      const inferredBaseUrl =
        query.baseUrl ??
        env.PUBLIC_BASE_URL ??
        `${request.protocol}://${request.headers.host ?? request.hostname}`

      try {
        const resolved = await resolveSpec(
          query.spec,
          {
            runtime: query.runtime,
            baseUrl: inferredBaseUrl,
          },
          getPrismStorage(),
        )
        reply.send(resolved)
      } catch (error) {
        if (
          error instanceof PackageNotFoundError ||
          error instanceof VersionNotFoundError ||
          error instanceof EntryPointResolutionError
        ) {
          reply.code(404).send({ message: error.message })
          return
        }
        throw error
      }
    },
  )
}
