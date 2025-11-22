import Fastify from 'fastify'
import multipart from '@fastify/multipart'
import { registerPackageRoutes } from './routes/packages'
import { registerPublishRoute } from './routes/publish'
import { registerResolveRoute } from './routes/resolve'
import { registerSearchRoute } from './routes/search'
import { registerNpmCompatRouter } from './routes/npmCompat'
import { ensureStorageRoots } from './storage'
import { registerErrorHandler } from './utils/errorHandler'

export const createServer = async () => {
  await ensureStorageRoots()
  // Logger policy:
  // - Disable logs entirely during tests
  // - Respect LOG_LEVEL when provided (e.g., debug, info, warn, error)
  // - Default to Fastify's standard logger otherwise
  const logger = process.env.NODE_ENV === 'test'
    ? false
    : process.env.LOG_LEVEL
    ? { level: process.env.LOG_LEVEL }
    : true

  const app = Fastify({ logger })
  await app.register(multipart)
  registerPackageRoutes(app)
  registerPublishRoute(app)
  registerResolveRoute(app)
  registerSearchRoute(app)
  // npm compatibility layer (mounted at root, isolated module, opt-in design)
  app.register(async (instance) => {
    registerNpmCompatRouter(instance)
  })
  registerErrorHandler(app)
  return app
}
