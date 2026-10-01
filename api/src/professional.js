import { Router } from 'express'
import { validDate } from './availability.js'

const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i
const bookingFields = `b.id, b.customer_name AS "clienteNome", b.status, b.observacoes,
  to_char(b.starts_at AT TIME ZONE 'America/Fortaleza', 'YYYY-MM-DD') AS data,
  to_char(b.starts_at AT TIME ZONE 'America/Fortaleza', 'HH24:MI') AS horario,
  s.nome AS servico, s.duracao, p.nome AS profissional`

export function createProfessionalRouter(query) {
  const router = Router()

  router.use(async (request, response, next) => {
    if (request.claims?.professional !== true)
      return response.status(403).json({ error: 'Acesso de profissional necessário.' })
    try {
      const { rows } = await query(`SELECT p.id, p.nome, p.especialidade
        FROM professional_accounts a JOIN professionals p ON p.id = a.professional_id
        WHERE a.firebase_uid = $1 AND p.ativo = true`, [request.uid])
      if (!rows.length) return response.status(403).json({ error: 'Acesso profissional não vinculado ou inativo.' })
      request.professional = rows[0]
      next()
    } catch (error) { next(error) }
  })

  router.get('/me', (request, response) => response.json(request.professional))

  router.get('/dashboard', async (request, response, next) => {
    try {
      const { rows } = await query(`SELECT count(*) FILTER (WHERE status IN ('confirmado', 'em_atendimento')) AS hoje,
        count(*) FILTER (WHERE status = 'concluido') AS atendidos
        FROM bookings WHERE professional_id = $1
        AND (starts_at AT TIME ZONE 'America/Fortaleza')::date =
          (now() AT TIME ZONE 'America/Fortaleza')::date`, [request.professional.id])
      response.json({ hoje: Number(rows[0]?.hoje || 0), atendidos: Number(rows[0]?.atendidos || 0) })
    } catch (error) { next(error) }
  })

  router.get('/bookings', async (request, response, next) => {
    const { start, end, status, offset = '0' } = request.query
    const days = Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)
    if (!validDate(start) || !validDate(end) || days < 86400000 || days > 32 * 86400000 ||
        (status !== undefined && !['confirmado', 'em_atendimento', 'concluido', 'cancelado'].includes(status)) ||
        typeof offset !== 'string' || !/^\d{1,6}$/.test(offset) || Number(offset) > 100000)
      return response.status(400).json({ error: 'Confira o período e os filtros da agenda.' })
    try {
      const { rows } = await query(`SELECT ${bookingFields}
        FROM bookings b JOIN services s ON s.id = b.service_id
        JOIN professionals p ON p.id = b.professional_id
        WHERE b.professional_id = $1
          AND b.starts_at >= ($2::date::timestamp AT TIME ZONE 'America/Fortaleza')
          AND b.starts_at < ($3::date::timestamp AT TIME ZONE 'America/Fortaleza')
          AND ($4::text IS NULL OR b.status = $4)
        ORDER BY b.starts_at ASC, b.id ASC LIMIT 100 OFFSET $5`,
      [request.professional.id, start, end, status ?? null, Number(offset)])
      response.json(rows)
    } catch (error) { next(error) }
  })

  router.patch('/bookings/:id/status', async (request, response, next) => {
    const { status } = request.body || {}
    const previous = { em_atendimento: 'confirmado', concluido: 'em_atendimento' }
    if (!uuid.test(request.params.id) || !Object.hasOwn(previous, status) || Object.keys(request.body || {}).length !== 1)
      return response.status(400).json({ error: 'Agendamento ou status inválido.' })
    try {
      const { rows } = await query(`UPDATE bookings SET status = $3
        WHERE id = $1 AND professional_id = $2 AND status = $4 RETURNING id, status`,
      [request.params.id, request.professional.id, status, previous[status]])
      if (!rows.length) return response.status(409).json({ error: 'O agendamento mudou ou não pertence à sua agenda. Atualize a tela.' })
      response.json(rows[0])
    } catch (error) { next(error) }
  })

  router.get('/hours', async (request, response, next) => {
    try {
      const { rows } = await query(`SELECT weekday AS dia, to_char(opens_at, 'HH24:MI') AS abertura,
        to_char(closes_at, 'HH24:MI') AS fechamento
        FROM professional_hours WHERE professional_id = $1 ORDER BY weekday`, [request.professional.id])
      response.json(rows)
    } catch (error) { next(error) }
  })

  router.get('/services', async (_request, response, next) => {
    try {
      const { rows } = await query('SELECT id, nome, preco::text AS preco, duracao FROM services WHERE ativo = true ORDER BY ordem, nome')
      response.json(rows)
    } catch (error) { next(error) }
  })

  return router
}
