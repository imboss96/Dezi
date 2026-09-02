import Fastify from 'fastify'
import cors from '@fastify/cors'
import { config } from './config.js'
import { healthRoutes } from './routes/health.js'
import { profileRoutes } from './routes/profiles.js'

const app = Fastify({ logger: true })
await app.register(cors, { origin: config.frontendOrigin })
await app.register(healthRoutes)
await app.register(profileRoutes)

try {
  await app.listen({ port: config.port, host: '0.0.0.0' })
} catch (error) {
  app.log.error(error)
  process.exit(1)
}
