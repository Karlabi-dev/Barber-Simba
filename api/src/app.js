import express from 'express'
import { getPool } from './db.js'
import { requireUser, verifyFirebaseToken } from './auth.js'

const bookingFields = `b.id, b.status, b.observacoes,
  to_char(b.starts_at AT TIME ZONE 'America/Fortaleza', 'YYYY-MM-DD') AS data,
  to_char(b.starts_at AT TIME ZONE 'America/Fortaleza', 'HH24:MI') AS horario,
  s.nome AS servico, p.nome AS profissional`

export function createApp(query = (sql, params) => getPool().query(sql, params), verifyToken = verifyFirebaseToken) {
  const app = express()
  app.disable('x-powered-by')
  app.use(express.json({ limit: '16kb' }))

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

  const authenticated = requireUser(verifyToken)
  app.get('/api/bookings', authenticated, async (request, response, next) => {
    try {
      const { rows } = await query(`SELECT ${bookingFields}
        FROM bookings b JOIN services s ON s.id = b.service_id
        JOIN professionals p ON p.id = b.professional_id
        WHERE b.firebase_uid = $1 ORDER BY b.starts_at DESC`, [request.uid])
      response.json(rows)
    } catch (error) { next(error) }
  })

  app.post('/api/bookings', authenticated, async (request, response, next) => {
    const { serviceSlug, professionalSlug, data, horario, observacoes = '' } = request.body || {}
    const parsedDate = /^\d{4}-\d{2}-\d{2}$/.test(data) && new Date(`${data}T12:00:00Z`)
    const validDate = parsedDate && !Number.isNaN(parsedDate.getTime()) && parsedDate.toISOString().slice(0, 10) === data
    const validTime = /^([01]\d|2[0-3]):[0-5]\d$/.test(horario)
    const startsAt = validDate && validTime && new Date(`${data}T${horario}:00-03:00`)
    if (typeof serviceSlug !== 'string' || serviceSlug.length > 100 ||
        typeof professionalSlug !== 'string' || professionalSlug.length > 100 ||
        typeof observacoes !== 'string' || observacoes.length > 500 ||
        !startsAt || Number.isNaN(startsAt.getTime()) || startsAt <= new Date()) {
      return response.status(400).json({ error: 'Confira o serviço, profissional e horário futuro.' })
    }
    try {
      const { rows } = await query(`WITH created AS (
        INSERT INTO bookings (firebase_uid, service_id, professional_id, starts_at, observacoes)
        SELECT $1, s.id, p.id, ($4::date + $5::time) AT TIME ZONE 'America/Fortaleza', $6
        FROM services s CROSS JOIN professionals p
        WHERE s.slug = $2 AND s.ativo = true AND p.slug = $3 AND p.ativo = true
        RETURNING *
      ) SELECT ${bookingFields} FROM created b
        JOIN services s ON s.id = b.service_id
        JOIN professionals p ON p.id = b.professional_id`,
      [request.uid, serviceSlug, professionalSlug, data, horario, observacoes])
      if (!rows.length) return response.status(400).json({ error: 'Serviço ou profissional indisponível.' })
      response.status(201).json(rows[0])
    } catch (error) {
      if (error.code === '23505') return response.status(409).json({ error: 'Este horário já foi reservado. Escolha outro.' })
      next(error)
    }
  })

  app.patch('/api/bookings/:id/cancel', authenticated, async (request, response, next) => {
    if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(request.params.id))
      return response.status(400).json({ error: 'Agendamento inválido.' })
    try {
      const { rows } = await query(`UPDATE bookings SET status = 'cancelado'
        WHERE id = $1 AND firebase_uid = $2 AND status = 'confirmado' RETURNING id`,
      [request.params.id, request.uid])
      if (!rows.length) return response.status(404).json({ error: 'Agendamento não encontrado ou já encerrado.' })
      response.json({ id: rows[0].id, status: 'cancelado' })
    } catch (error) { next(error) }
  })

  app.use((error, _request, response, _next) => {
    console.error('Falha na API:', error)
    response.status(503).json({ error: 'Não foi possível consultar os dados agora.' })
  })

  return app
}
