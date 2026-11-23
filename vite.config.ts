import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import { execSync } from 'node:child_process'
import { resolve } from 'node:path'

// Short commit hash for "About this OS": Vercel's commit, else local git.
function buildHash() {
  const vercel = process.env.VERCEL_GIT_COMMIT_SHA
  if (vercel) return vercel.slice(0, 7)
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
  } catch {
    return 'dev'
  }
}

// In dev, /V2 without a trailing slash would fall back to the root site:
// send /V2 and /v2 to /V2/ so the copy always loads (Vercel has rewrites).
const v2Redirect: Plugin = {
  name: 'v2-redirect',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const [path, query] = (req.url ?? '').split('?')
      if (path === '/V2' || path === '/v2' || path === '/v2/') {
        res.statusCode = 302
        res.setHeader('Location', '/V2/' + (query ? `?${query}` : ''))
        res.end()
        return
      }
      next()
    })
  },
  configurePreviewServer(server) {
    server.middlewares.use((req, res, next) => {
      const [path, query] = (req.url ?? '').split('?')
      if (path === '/V2' || path === '/v2' || path === '/v2/') {
        res.statusCode = 302
        res.setHeader('Location', '/V2/' + (query ? `?${query}` : ''))
        res.end()
        return
      }
      next()
    })
  },
}

export default defineConfig({
  plugins: [react(), v2Redirect],
  // Two sites in one build: the main one at / (src) and a copy at /V2
  // (src-v2, assets in public/V2) to try changes without touching /.
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        v2: resolve(__dirname, 'V2/index.html'),
      },
    },
  },
  define: {
    __BUILD_HASH__: JSON.stringify(buildHash()),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString().slice(0, 10)),
  },
  server: { port: 5174, strictPort: true, host: '127.0.0.1' },
  preview: { port: 5174, strictPort: true, host: '127.0.0.1' },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    include: ['src/test/**/*.test.ts'],
  },
})
