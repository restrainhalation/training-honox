import { createRoute } from 'honox/factory'

type Metadata = {
  headers: Record<string, string>
}

const getCache = async (kv: KVNamespace<string>, key: string): Promise<KVNamespaceGetWithMetadataResult<ArrayBuffer, Metadata>> => {
  return await kv.getWithMetadata<Metadata>(key, {
    type: 'arrayBuffer',
  })
}

const getHeaders = (headers: Record<string, string>) => {
  console.log('getHeaders', headers)
  const kv: Record<string, string> = {}
  for (const [key, value] of Object.entries(headers)) {
    kv[key] = value
  }
  kv['Cache-Control'] = `public, max-age=${60 * 60 * 24 * 30}`
  return kv
}

export default createRoute(async (c) => {
  try {
    let { value, metadata } = await getCache(c.env.KV, c.req.url)
    console.log('getCache1#KV: ', value, metadata)
    if (value && metadata) {
      console.log('headers1: ', metadata.headers)
      console.log('headers1-2: ', getHeaders(metadata.headers))
      return c.body(value, 200, getHeaders(metadata.headers))
    }
    console.log('Not found (KV)')

    const { key } = c.req.param()
    const bucketObject = await c.env.R2.get(key)
    if (bucketObject === null) {
      console.log('Not found (R2)')
      return c.notFound()
    }

    const { body, httpMetadata, etag } = bucketObject
    console.log('R2: ', body, httpMetadata, etag)

    await c.env.KV.put(
      c.req.url,
      await (new Response(body).clone().arrayBuffer()),
      {
        metadata: {
          'Content-Type': httpMetadata?.contentType ?? 'application/octet-stream',
          'etag': `"${etag}"`
        },
      }
    )
    console.log('PUT to R2')

    const { value: value2, metadata: metadata2 } = await getCache(c.env.KV, c.req.url)
    console.log('getCache2#KV: ', value2, metadata2)
    if (value2 && metadata2) {
      console.log('headers2: ', metadata2.headers)
      console.log('headers2-2: ', getHeaders(metadata2.headers))
      return c.body(value2, 200, getHeaders(metadata2.headers))
    }

    console.log('Not found (KV 2)')
    c.status(500)
    return c.text(JSON.stringify({ message: 'error' }))

  } catch (e: unknown) {
    const error = e as Error
    console.log(error)
    c.status(500)
    return c.text(JSON.stringify(error))
  }
})
