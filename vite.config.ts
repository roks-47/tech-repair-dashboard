import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import path from 'node:path'

// Plugin para compartilhar dados entre PC e Celular no Wi-Fi local automaticamente sem recarregar a página
function localSharedDatabasePlugin() {
  const dataDir = path.resolve(process.cwd(), 'data')
  const ordersFile = path.join(dataDir, 'orders.json')
  const settingsFile = path.join(dataDir, 'settings.json')

  // Garante que a pasta de dados existe
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }

  return {
    name: 'local-shared-database',
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        // Rota de Ordens de Serviço
        if (req.url === '/api/orders' || req.url?.startsWith('/api/orders?')) {
          if (req.method === 'GET') {
            res.setHeader('Content-Type', 'application/json')
            if (fs.existsSync(ordersFile)) {
              const content = fs.readFileSync(ordersFile, 'utf-8')
              return res.end(content || '[]')
            }
            return res.end('null')
          }

          if (req.method === 'POST') {
            let body = ''
            req.on('data', (chunk: any) => { body += chunk })
            req.on('end', () => {
              try {
                JSON.parse(body)
                fs.writeFileSync(ordersFile, body, 'utf-8')
                res.setHeader('Content-Type', 'application/json')
                return res.end(JSON.stringify({ success: true }))
              } catch (e: any) {
                res.statusCode = 400
                res.setHeader('Content-Type', 'application/json')
                return res.end(JSON.stringify({ error: e.message }))
              }
            })
            return
          }
        }

        // Rota de Configurações
        if (req.url === '/api/settings' || req.url?.startsWith('/api/settings?')) {
          if (req.method === 'GET') {
            res.setHeader('Content-Type', 'application/json')
            if (fs.existsSync(settingsFile)) {
              const content = fs.readFileSync(settingsFile, 'utf-8')
              return res.end(content || '{}')
            }
            return res.end('null')
          }

          if (req.method === 'POST') {
            let body = ''
            req.on('data', (chunk: any) => { body += chunk })
            req.on('end', () => {
              try {
                JSON.parse(body)
                fs.writeFileSync(settingsFile, body, 'utf-8')
                res.setHeader('Content-Type', 'application/json')
                return res.end(JSON.stringify({ success: true }))
              } catch (e: any) {
                res.statusCode = 400
                res.setHeader('Content-Type', 'application/json')
                return res.end(JSON.stringify({ error: e.message }))
              }
            })
            return
          }
        }

        next()
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  server: {
    // IMPORTANTE: Ignora a pasta data para que gravações no disco NUNCA reiniciem ou recarreguem a página!
    watch: {
      ignored: [
        '**/data/**',
        '**/data/orders.json',
        '**/data/settings.json',
        '**/*.json'
      ],
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    localSharedDatabasePlugin(),
  ],
})
