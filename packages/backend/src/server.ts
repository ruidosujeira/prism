import Fastify from 'fastify'
import multipart from '@fastify/multipart'
import { registerPackageRoutes } from './routes/packages'
import { registerPublishRoute } from './routes/publish'
import { ensureStorageRoots } from './storage'

export const createServer = async () => {
  await ensureStorageRoots()
  const app = Fastify({ logger: true })
  await app.register(multipart)
  registerPackageRoutes(app)
  registerPublishRoute(app)
  return app
}
