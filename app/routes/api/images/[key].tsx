import { createRoute } from 'honox/factory'

type Metadata = {
  'Content-Type': string;
  'etag': string;
}

const getCache = async (kv: KVNamespace<string>, key: string): Promise<KVNamespaceGetWithMetadataResult<ArrayBuffer, Metadata>> => {
  return await kv.getWithMetadata<Metadata>(key, {
    type: 'arrayBuffer',
  })
}

const getHeaders = (headers: Record<string, string>) => {
  const kv: Record<string, string> = {}
  for (const [key, value] of Object.entries(headers)) {
    kv[key] = value
  }
  kv['Cache-Control'] = `public, max-age=${60 * 60 * 24 * 60}`
  return kv
}

export default createRoute(async (c) => {
  try {
    let { value, metadata } = await getCache(c.env.KV, c.req.url)
    if (value && metadata) {
      return c.body(value, 200, getHeaders(metadata))
    }

    const { key } = c.req.param()
    const bucketObject = await c.env.R2.get(key)
    if (bucketObject === null) {
      return c.notFound()
    }

    const { body, httpMetadata, httpEtag } = bucketObject

    await c.env.KV.put(
      c.req.url,
      await (new Response(body).clone().arrayBuffer()),
      {
        metadata: {
          'Content-Type': httpMetadata?.contentType ?? 'application/octet-stream',
          ETag: `W/${httpEtag}`,
        },
      }
    )

    const { value: value2, metadata: metadata2 } = await getCache(c.env.KV, c.req.url)
    if (value2 && metadata2) {
      return c.body(value2, 200, getHeaders(metadata2))
    }

    return c.text(JSON.stringify({ message: 'error' }), 500)

  } catch (e: unknown) {
    const error = e as Error
    console.log(error)
    return c.text(JSON.stringify(error), 500)
  }
})
