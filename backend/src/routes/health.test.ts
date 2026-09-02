import Fastify from 'fastify'
import { describe, expect, it } from 'vitest'
import { healthRoutes } from './health.js'

describe('health routes', () => {
  it('returns an operational health status', async () => {
    const app = Fastify()
    await app.register(healthRoutes)

    const response = await app.inject({ method: 'GET', url: '/health' })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ status: 'ok', service: 'dezhub-backend' })
    await app.close()
  })
})
