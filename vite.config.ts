import mdx from '@mdx-js/rollup'
import pages from '@hono/vite-cloudflare-pages'
import adapter from '@hono/vite-dev-server/cloudflare'
import honox from 'honox/vite'
import client from 'honox/vite/client'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
import { defineConfig } from 'vite'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig(({ mode }) => {
  if (mode === 'client') {
    return {
      plugins: [client()],
    }
  } else {
    return {
      ssr: { external: [
        "react",
        "react-dom",
        "@yamada-ui/react",
        "@yamada-ui/core",
      ] },
      plugins: [
        honox({
          devServer: {
            adapter
          }
        }),
        mdx({
          jsxImportSource: 'react',
          remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter],
        }),
        pages(),
        visualizer()
      ],
    }
  }
})
