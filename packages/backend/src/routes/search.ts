import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { PackageSearchRequestSchema } from '@prism/shared'
import { readJson } from '../utils/fs'
import { searchIndexPath } from '../storage/storageLayout'

const QuerySchema = z.object({ q: z.string().default('') })

export const registerSearchRoute = (app: FastifyInstance) => {
  app.get<{ Querystring: { q?: string } }>('/v1/search', async (request, reply) => {
    const { q } = QuerySchema.parse(request.query)
    const index = (await readJson<any>(searchIndexPath())) ?? {
      generatedAt: new Date().toISOString(),
      documents: [],
    }
    const query = q.trim().toLowerCase()
    const results = (index.documents as any[])
      .filter((doc) =>
        query.length === 0
          ? true
          : doc.identifier?.name?.toLowerCase().includes(query) ||
            (doc.keywords ?? []).some((k: string) => k.toLowerCase().includes(query)) ||
            (doc.description ?? '').toLowerCase().includes(query),
      )
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    reply.send({ query: { query: q, filters: {} }, results })
  })
}
