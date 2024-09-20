import type { Context } from 'hono'
import { env } from 'hono/adapter'
import { createRoute } from 'honox/factory'

export const POST = createRoute(async (c: Context) => {
  try {
    const {
      CF_ACCOUNT_ID: cfAccountId,
      CF_IMAGES_API_TOKEN_FOR_EDIT: cfImagesApiTokenForEdit
    } = env<{
      CF_ACCOUNT_ID: string;
      CF_IMAGES_API_TOKEN_FOR_EDIT: string;
    }>(c)

    const formData = new FormData()
    formData.append('requireSignedURLs', 'true')

    const response = await fetch(
      [
        'https://api.cloudflare.com/client/v4/accounts',
        cfAccountId,
        'images/v2/direct_upload'
      ].join('/'),
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cfImagesApiTokenForEdit}`,
      },
      body: formData,
    })

    return c.text(JSON.stringify(await response.json() || {}))
  } catch (e: unknown) {
    const error = e as Error
    console.log(error)
    return c.text(JSON.stringify(error), 500)
  }
})
