import { createServer } from './server'
import { env } from './config/env'

const start = async () => {
  const server = await createServer()
  await server.listen({ port: env.PORT, host: '0.0.0.0' })
}

start().catch((error) => {
  console.error(error)
  process.exit(1)
})
