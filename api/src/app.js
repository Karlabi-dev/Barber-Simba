import express from 'express'
import { getPool } from './db.js'
import { requireAdmin, requireUser, verifyFirebaseToken } from './auth.js'
import { createAdminRouter } from './admin.js'
import { availableTimes, futureLocal, scheduleDays, validDate, validTime } from './availability.js'

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
               COALESCE(${scheduleDays}, '') AS dias, image_key AS "imageKey"
        FROM professionals WHERE ativo = true ORDER BY ordem, nome
      `)
      response.json(rows)
    } catch (error) { next(error) }
  })

  app.get('/api/availability', async (request, response, next) => {
    const { serviceSlug, professionalSlug, data } = request.query
    if (typeof serviceSlug !== 'string' || !serviceSlug || serviceSlug.length > 100 ||
        typeof professionalSlug !== 'string' || !professionalSlug || professionalSlug.length > 100 || !validDate(data))
      return response.status(400).json({ error: 'Confira serviço, profissional e data.' })
    try {
      const { rows } = await query(`SELECT p.id AS "professionalId", s.duracao,
        ph.opens_at::text AS "opensAt", ph.closes_at::text AS "closesAt"
        FROM services s CROSS JOIN professionals p
        LEFT JOIN professional_hours ph ON ph.professional_id = p.id
          AND ph.weekday = EXTRACT(ISODOW FROM $3::date)
        WHERE s.slug = $1 AND s.ativo = true AND p.slug = $2 AND p.ativo = true`,
      [serviceSlug, professionalSlug, data])
      if (!rows.length) return response.status(404).json({ error: 'Serviço ou profissional não encontrado.' })
      if (!rows[0].opensAt) return response.json({ data, horarios: [] })
      const occupied = await query(`SELECT
        EXTRACT(EPOCH FROM ((b.starts_at AT TIME ZONE 'America/Fortaleza') - $2::date::timestamp)) / 60 AS inicio,
        EXTRACT(EPOCH FROM ((b.ends_at AT TIME ZONE 'America/Fortaleza') - $2::date::timestamp)) / 60 AS fim
        FROM bookings b WHERE b.professional_id = $1 AND b.status = 'confirmado'
          AND b.starts_at < (($2::date + 1)::timestamp AT TIME ZONE 'America/Fortaleza')
          AND b.ends_at > ($2::date::timestamp AT TIME ZONE 'America/Fortaleza')`,
      [rows[0].professionalId, data])
      response.json({ data, horarios: availableTimes({ date: data, duration: rows[0].duracao,
        opensAt: rows[0].opensAt, closesAt: rows[0].closesAt, occupied: occupied.rows }) })
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
    if (typeof serviceSlug !== 'string' || serviceSlug.length > 100 ||
        typeof professionalSlug !== 'string' || professionalSlug.length > 100 ||
        typeof observacoes !== 'string' || observacoes.length > 500 ||
        !validDate(data) || !validTime(horario) || Number(horario.slice(3)) % 30 !== 0 ||
        !futureLocal(data, horario)) {
      return response.status(400).json({ error: 'Confira o serviço, profissional e horário futuro.' })
    }
    try {
      const { rows } = await query(`WITH created AS (
        INSERT INTO bookings (firebase_uid, service_id, professional_id, starts_at, ends_at, observacoes)
        SELECT $1, s.id, p.id,
          ($4::date + $5::time) AT TIME ZONE 'America/Fortaleza',
          (($4::date + $5::time) AT TIME ZONE 'America/Fortaleza') + s.duracao * interval '1 minute', $6
        FROM services s CROSS JOIN professionals p
        JOIN professional_hours ph ON ph.professional_id = p.id
          AND ph.weekday = EXTRACT(ISODOW FROM $4::date)
        WHERE s.slug = $2 AND s.ativo = true AND p.slug = $3 AND p.ativo = true
          AND ($4::date + $5::time) >= ($4::date + ph.opens_at)
          AND ($4::date + $5::time) + s.duracao * interval '1 minute' <= ($4::date + ph.closes_at)
          AND ($4::date + $5::time) AT TIME ZONE 'America/Fortaleza' > now()
        RETURNING *
      ) SELECT ${bookingFields} FROM created b
        JOIN services s ON s.id = b.service_id
        JOIN professionals p ON p.id = b.professional_id`,
      [request.uid, serviceSlug, professionalSlug, data, horario, observacoes])
      if (!rows.length) return response.status(400).json({ error: 'Serviço, profissional ou horário indisponível.' })
      response.status(201).json(rows[0])
    } catch (error) {
      if (error.code === '23505' || error.code === '23P01')
        return response.status(409).json({ error: 'Este horário já foi reservado. Escolha outro.' })
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

  app.use('/api/admin', authenticated, requireAdmin, createAdminRouter(query))

  app.use((error, _request, response, _next) => {
    console.error('Falha na API:', error)
    response.status(503).json({ error: 'Não foi possível consultar os dados agora.' })
  })

  return app
}
