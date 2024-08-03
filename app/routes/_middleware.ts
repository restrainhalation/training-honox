import { cache } from 'hono/cache'
import { etag } from 'hono/etag'
import  { createRoute } from 'honox/factory'

export default createRoute(
  etag(),
  cache({
    cacheName: 'training-honox',
    cacheControl: `public, max-age=${60 * 60 * 24 * 30}`,
  })
)
