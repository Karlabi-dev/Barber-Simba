import express from 'express'
import { getPool } from './db.js'

export function createApp(query = (sql, params) => getPool().query(sql, params)) {
  const app = express()
  app.disable('x-powered-by')

  app.get('/api/health', async (_request, response, next) => {
    try {
      await query('SELECT 1')
      response.json({ status: 'ok' })
    } catch (error) { next(error) }
  })

  app.get('/api/services', async (_request, response, next) => {
    try {
      const { rows } = await query(`
        SELECT id, slug, nome, descricao, categoria, preco::text AS preco,
               duracao, icon_key AS "iconKey"
        FROM services WHERE ativo = true ORDER BY ordem, nome
      `)
      response.json(rows)
    } catch (error) { next(error) }
  })

  app.get('/api/professionals', async (_request, response, next) => {
    try {
      const { rows } = await query(`
        SELECT id, slug, nome, especialidade, avaliacao::text AS avaliacao,
               dias, image_key AS "imageKey"
        FROM professionals WHERE ativo = true ORDER BY ordem, nome
      `)
      response.json(rows)
    } catch (error) { next(error) }
  })

  app.use((error, _request, response, _next) => {
    console.error('Falha na API:', error)
    response.status(503).json({ error: 'Não foi possível consultar os dados agora.' })
  })

  return app
}
