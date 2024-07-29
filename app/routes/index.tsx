import { createRoute } from 'honox/factory'
import Counter from '../islands/counter'
import { drizzle } from 'drizzle-orm/d1'
import { users } from '../../db/schemas';

export interface Env {
  DB: D1Database;
}

export default createRoute(async (c) => {
  const name = c.req.query('name') ?? 'Hono'
  const db = drizzle(c.env.DB)
  const results = await db.select().from(users).all()
  return c.render(
    <div>
      <h1>Hello, {name}!</h1>
      <Counter />
      <hr />
      {results && results.length && results.map((result, index) => (
        <p key={index}>
          {result.id}: {result.name}
        </p>
      ))}
    </div>,
    { title: name }
  )
})
