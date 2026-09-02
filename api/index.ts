import { buildApp } from '../backend/src/app.js'
import type { IncomingMessage, ServerResponse } from 'node:http'

let appPromise: ReturnType<typeof buildApp> | undefined

export default async function handler(request: IncomingMessage, response: ServerResponse) {
  try {
    appPromise ??= buildApp()
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
