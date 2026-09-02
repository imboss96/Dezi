import type { FastifyInstance } from 'fastify'

export async function healthRoutes(app: FastifyInstance) {
  app.get('/', async () => ({ service: 'dezhub-backend', health: '/health' }))
  app.get('/health', async () => ({ status: 'ok', service: 'dezhub-backend' }))
}
