import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const EXTRACTED = path.resolve(__dirname, '../extracted')

/** 把 /lesson-pages/<sid>/.../page-NNN.png 映射到 extracted 下的渲染图 */
function serveLessonPages(): Plugin {
  return {
    name: 'serve-lesson-pages',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0] ?? ''
        if (!url.startsWith('/lesson-pages/')) return next()
        const rel = decodeURIComponent(url.slice('/lesson-pages/'.length))
        if (rel.includes('..')) {
          res.statusCode = 400
          res.end('bad path')
          return
        }
        const file = path.join(EXTRACTED, rel)
        if (!file.startsWith(EXTRACTED) || !fs.existsSync(file)) {
          res.statusCode = 404
          res.end('not found')
          return
        }
        const ext = path.extname(file).toLowerCase()
        const type =
          ext === '.png'
            ? 'image/png'
            : ext === '.jpg' || ext === '.jpeg'
              ? 'image/jpeg'
              : 'application/octet-stream'
        res.setHeader('Content-Type', type)
        res.setHeader('Cache-Control', 'public, max-age=86400')
        fs.createReadStream(file).pipe(res)
      })
    },
  }
}

// Vercel 以 web/ 为 Root Directory 时产出 dist；本地朋友包仍写到仓库根 Outputs/
const outDir = process.env.VERCEL ? 'dist' : '../Outputs'

export default defineConfig({
  base: './',
  plugins: [react(), serveLessonPages()],
  server: {
    port: 5173,
    host: '127.0.0.1',
  },
  build: {
    outDir,
    emptyOutDir: true,
  },
})

