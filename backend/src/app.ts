import Fastify from 'fastify'
import cors from '@fastify/cors'
import { config } from './config.js'
import { healthRoutes } from './routes/health.js'
import { profileRoutes } from './routes/profiles.js'

export async function buildApp() {
  const app = Fastify({ logger: true })
  await app.register(cors, { origin: config.frontendOrigin === '*' ? true : config.frontendOrigin })
  await app.register(healthRoutes)
  await app.register(profileRoutes)
  return app
}
