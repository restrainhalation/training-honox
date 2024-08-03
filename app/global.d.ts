import '@hono/react-renderer'

declare module 'hono' {
  interface Env {
    Bindings: {
      DB: D1Database,
      R2: R2Bucket,
      KV: KVNamespace,
    }
  }
}

declare module '@hono/react-renderer' {
  interface Props {
    title?: string
  }
}
