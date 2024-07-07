import { Button } from '@yamada-ui/react'
import { useState } from 'hono/jsx'

export default function Counter() {
  const [count, setCount] = useState(0)
  return (
    <div>
      <p>{count}</p>
      <Button onClick={() => setCount(count + 1)}>Increment</Button>
    </div>
  )
}
