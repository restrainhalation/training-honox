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
    console.log('Not found (KV)')

    const bucket = c.env.R2
    const { key } = c.req.param()
    const bucketObject = await bucket.get(key)
    if (bucketObject !== null) {
    const { body, httpMetadata, etag } = bucketObject
    console.log('R2: ', body, httpMetadata, etag)
    await c.env.KV.put(
      c.req.url,
      await (new Response(body).clone().arrayBuffer()),
      {
        metadata: httpMetadata,
      }
    )
    console.log('PUT to R2')
    return c.body(body, 200, {
      'Cache-Control': `public, max-age=${60 * 60 * 24 * 30}`,
      'Content-Type': httpMetadata?.contentType ?? 'application/octet-stream',
      'etag': `"${etag}"`
    })
    } else {
      console.log('Not found (R2)')
      return c.notFound()
    }

  } catch (e: unknown) {
    const error = e as Error
    console.log(error)
    c.status(500)
    return c.text(JSON.stringify(error))
  }
})
