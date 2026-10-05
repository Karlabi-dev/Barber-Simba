import express from 'express'
import { existsSync } from 'node:fs'
import path from 'node:path'

export function mountFrontend(app, directory) {
  const index = path.join(directory, 'index.html')
  if (!existsSync(index)) throw new Error('Frontend não encontrado. Execute o build de AppSimba antes de iniciar.')

  app.use('/api', (_request, response) => response.status(404).json({ error: 'Rota da API não encontrada.' }))
  app.use(express.static(directory, { index: false }))
  app.use((request, response, next) => {
    if ((request.method !== 'GET' && request.method !== 'HEAD') || path.extname(request.path)) return next()
    response.sendFile(index)
  })
}
