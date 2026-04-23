import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { readdirSync } from 'fs'

// Vite plugin to handle URL rewrites for local development (matches vercel.json)
const urlRewritesPlugin = () => {
  const rewrites: Record<string, string> = {
    '/holder': '/holder-wallet.html',
    '/issuer': '/issuer.html',
    '/organizer': '/issuer.html',
    '/verifier': '/recruiter.html',
    '/dashboard': '/index.html',
    '/metamask': '/metamask.html',
  }

  return {
    name: 'url-rewrites',
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: () => void) => {
        if (!req.url) return next()
        const pathname = String(req.url).split('?')[0]
        const key =
          pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname
        const rewrite = rewrites[key] || rewrites[pathname]
        if (rewrite) {
          const qs = req.url.includes('?') ? String(req.url).slice(String(req.url).indexOf('?')) : ''
          req.url = rewrite + qs
        }
        next()
      })
    },
  }
}

// Get all HTML files from root directory
function getHtmlInputs() {
  const rootDir = __dirname
  const htmlFiles = readdirSync(rootDir)
    .filter(file => file.endsWith('.html'))
    .reduce((acc: Record<string, string>, file: string) => {
      const name = file.replace('.html', '')
      acc[name === 'index' ? 'main' : name] = resolve(rootDir, file)
      return acc
    }, {})
  return htmlFiles
}

export default defineConfig({
  appType: 'mpa',
  plugins: [react(), urlRewritesPlugin()],
  publicDir: 'public',
  root: '.', // Root directory for the project
  build: {
    rollupOptions: {
      input: getHtmlInputs(),
    },
  },
  server: {
    port: 5173,
    open: true,
    fs: {
      allow: ['..'],
    },
    proxy: {
      '/present': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '^/issue(?:$|/)': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/issue-anchored': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/verify': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/receive-vc': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/generate-did': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/revoke': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/status': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '^/2fa(?:$|/)': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})
