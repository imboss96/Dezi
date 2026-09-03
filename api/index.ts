import Fastify from 'fastify'
import cors from '@fastify/cors'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { config } from '../backend/src/config.js'
import { healthRoutes } from '../backend/src/routes/health.js'
import { profileRoutes } from '../backend/src/routes/profiles.js'
import { lifecycleRoutes } from '../backend/src/routes/lifecycle.js'

let appPromise: ReturnType<typeof createApp> | undefined

async function createApp() {
  const app = Fastify({ logger: true })
  await app.register(cors, { origin: config.frontendOrigin === '*' ? true : config.frontendOrigin, methods: ['GET', 'HEAD', 'POST', 'PATCH', 'DELETE', 'OPTIONS'] })
  await app.register(healthRoutes)
  await app.register(profileRoutes)
  await app.register(lifecycleRoutes)
  return app
}

export default async function handler(request: IncomingMessage, response: ServerResponse) {
  try {
    appPromise ??= createApp()
    const app = await appPromise
    await app.ready()
    request.url = request.url?.replace(/^\/api(?=\/|$)/, '') || '/'
    app.server.emit('request', request, response)
  } catch (error) {
    response.statusCode = 500
    response.setHeader('Content-Type', 'application/json')
    response.end(JSON.stringify({ error: 'API function failed to initialize' }))
    console.error(error)
  }
}
