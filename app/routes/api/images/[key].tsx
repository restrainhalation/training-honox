import { createRoute } from 'honox/factory'

type Metadata = {
  headers: Record<string, string>
}

export default createRoute(async (c) => {
  try {
    const { value, metadata } = await c.env.KV.getWithMetadata<Metadata>(c.req.url, {
      type: 'arrayBuffer',
    })
    console.log('KV: ', value, metadata)
    if (value && metadata) {
      return c.body(value, 200, metadata.headers)
    }

    const bucket = c.env.R2
    const { key } = c.req.param()
    const bucketObject = await bucket.get(key)
    if (bucketObject !== null) {
    const { body, httpMetadata, etag } = bucketObject
      await c.env.KV.put(c.req.url, body, {
        metadata: httpMetadata,
      })
      return c.body(body, 200, {
        'Cache-Control': `public, max-age=${60 * 60 * 24 * 30}`,
        'Content-Type': httpMetadata?.contentType ?? 'application/octet-stream',
        'etag': `"${etag}"`
      })
    } else {
      return c.notFound()
    }

  } catch (e: unknown) {
    const error = e as Error
    console.log(error)
    c.status(500)
    return c.text(JSON.stringify(error))
  }
})
