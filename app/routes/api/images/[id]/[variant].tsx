import type { Context, Env } from 'hono'
import { env } from 'hono/adapter'
import { createRoute } from 'honox/factory'

const IMAGE_DELIVERY_ORIGIN = 'https://imagedelivery.net'
const EXPIRATION = 60 * 60 * 24

const CACHE_CONTROL_MAX_AGE_FOR_IMAGE = 60 * 60 * 24

const bufferToHex = (buffer: ArrayBufferLike) =>
  [...new Uint8Array(buffer)].map(x => x.toString(16).padStart(2, '0')).join('')

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
    headers['Cache-Control'] = `public, max-age=${CACHE_CONTROL_MAX_AGE_FOR_IMAGE}`
    return c.body(value, 200, headers)
  }
}

export default createRoute(async (c: Context) => {
  try {
    let response: Response | undefined = await getResponse(c)
    if (response) {
      return response
    }

    const {
      CF_IMAGES_ACCOUNT_HASH: cfImagesAccountHash,
      CF_IMAGES_KEY: cfImagesKey
    } = env<{
      CF_IMAGES_ACCOUNT_HASH: string;
      CF_IMAGES_KEY: string;
    }>(c)

    const { id, variant } = c.req.param()
    let imageDeliveryUrl = new URL([
      IMAGE_DELIVERY_ORIGIN,
      cfImagesAccountHash,
      id,
      variant
    ].join('/'))

    const encoder = new TextEncoder();
    const secretKeyData = encoder.encode(cfImagesKey)
    const key = await crypto.subtle.importKey(
      'raw',
      secretKeyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )

    const expiry = Math.floor(Date.now() / 1000) + EXPIRATION
    imageDeliveryUrl.searchParams.set('exp', expiry.toString())

    const stringToSign = imageDeliveryUrl.pathname + '?' + imageDeliveryUrl.searchParams.toString()

    const mac = await crypto.subtle.sign('HMAC', key, encoder.encode(stringToSign))
    const sig = bufferToHex(new Uint8Array(mac).buffer)

    imageDeliveryUrl.searchParams.set('sig', sig)

    response = await fetch(imageDeliveryUrl, {
      headers: c.req.header(),
    })

    await c.env.KV.put(
      c.req.url,
      await (response.arrayBuffer()),
      {
        metadata: {
          'Content-Type': response.headers.get('content-type') ?? 'application/octet-stream',
          ETag: `W/${response.headers.get('etag')}`,
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
