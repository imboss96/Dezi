import Fastify from 'fastify'
import cors from '@fastify/cors'
import { config } from './config.js'
import { healthRoutes } from './routes/health.js'
import { profileRoutes } from './routes/profiles.js'
import { lifecycleRoutes } from './routes/lifecycle.js'

export async function buildApp() {
  const app = Fastify({ logger: true })
  await app.register(cors, { origin: config.frontendOrigin === '*' ? true : config.frontendOrigin, methods: ['GET', 'HEAD', 'POST', 'PATCH', 'DELETE', 'OPTIONS'] })
  await app.register(healthRoutes)
  await app.register(profileRoutes)
  await app.register(lifecycleRoutes)
  return app
}
