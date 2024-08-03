import { Context, Env } from 'hono'
import { createRoute } from 'honox/factory'

type Metadata = {
  'Content-Type': string;
  'etag': string;
}

const getResponse = async (c: Context<Env, any, {}>):Promise<Response | undefined> => {
  const { value, metadata } = await c.env.KV.getWithMetadata<Metadata>(c.req.url, {
    type: 'arrayBuffer',
  })

  if (value && metadata) {
    const headers: Record<string, string> = {}
    for (const [key, value] of Object.entries(metadata)) {
      headers[key] = value
    }
    headers['Cache-Control'] = `public, max-age=${60 * 60 * 24 * 60}`
    return c.body(value, 200, headers)
  }
}

export default createRoute(async (c) => {
  try {
    let response: Response | undefined = await getResponse(c)
    if (response) {
      return response
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

    response = await getResponse(c)
    if (response) {
      return response
    }

    return c.text(JSON.stringify({ message: 'error' }), 500)

  } catch (e: unknown) {
    const error = e as Error
    console.log(error)
    return c.text(JSON.stringify(error), 500)
  }
})
