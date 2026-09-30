import { Router } from 'express'
import { getAuth } from 'firebase-admin/auth'
import { minutes, scheduleDays, validDate, validTime } from './availability.js'

const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i
const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const shortText = value => typeof value === 'string' && value.trim().length > 0 && value.length <= 120
const optionalText = (value, max) => typeof value === 'string' && value.length <= max
const order = value => Number.isInteger(value) && value >= 0 && value <= 10000
const adminBookingFields = `b.id, b.firebase_uid AS "firebaseUid", b.customer_name AS "clienteNome",
  b.status, b.observacoes,
  to_char(b.starts_at AT TIME ZONE 'America/Fortaleza', 'YYYY-MM-DD') AS data,
  to_char(b.starts_at AT TIME ZONE 'America/Fortaleza', 'HH24:MI') AS horario,
  s.nome AS servico, p.nome AS profissional,
  b.service_id AS "serviceId", b.professional_id AS "professionalId"`
const specs = {
  services: {
    required: ['slug', 'nome', 'categoria', 'preco', 'duracao'],
    fields: {
      slug: [value => typeof value === 'string' && value.length <= 100 && slug.test(value), 'slug'],
      nome: [shortText, 'nome'],
      descricao: [value => optionalText(value, 500), 'descricao'],
      categoria: [shortText, 'categoria'],
      preco: [value => typeof value === 'string' && /^(?:0|[1-9]\d{0,7})(?:\.\d{1,2})?$/.test(value), 'preco'],
      duracao: [value => Number.isInteger(value) && value > 0 && value <= 1440, 'duracao'],
      iconKey: [shortText, 'icon_key'],
      ordem: [order, 'ordem'],
      ativo: [value => typeof value === 'boolean', 'ativo']
    },
    projection: 'id, slug, nome, descricao, categoria, preco::text AS preco, duracao, icon_key AS "iconKey", ordem, ativo'
  },
  professionals: {
    required: ['slug', 'nome'],
    fields: {
      slug: [value => typeof value === 'string' && value.length <= 100 && slug.test(value), 'slug'],
      nome: [shortText, 'nome'],
      especialidade: [value => optionalText(value, 200), 'especialidade'],
      avaliacao: [value => value === null || (typeof value === 'string' && /^(?:[0-4](?:\.\d)?|5(?:\.0)?)$/.test(value)), 'avaliacao'],
      imageKey: [shortText, 'image_key'],
      ordem: [order, 'ordem'],
      ativo: [value => typeof value === 'boolean', 'ativo']
    },
    projection: `id, slug, nome, especialidade, avaliacao::text AS avaliacao,
      COALESCE(${scheduleDays}, '') AS dias, image_key AS "imageKey", ordem, ativo`
  }
}

function validatedFields(body, spec, creating) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null
  const entries = Object.entries(body)
  if (!entries.length || entries.some(([key, value]) => !spec.fields[key]?.[0](value))) return null
  if (creating && spec.required.some(key => !Object.hasOwn(body, key))) return null
  return entries.map(([key, value]) => [spec.fields[key][1], value])
}

function catalogError(error, next, response) {
  if (error.code === '23505') return response.status(409).json({ error: 'Identificador já cadastrado.' })
  if (error.code === '23514' || error.code === '22003' || error.code === '22001')
    return response.status(400).json({ error: 'Dados fora dos limites permitidos.' })
  next(error)
}

export function createAdminRouter(query, accountDirectory) {
  const router = Router()
  const directory = () => accountDirectory || getAuth()

  router.get('/professionals/:id/access', async (request, response, next) => {
    if (!uuid.test(request.params.id)) return response.status(400).json({ error: 'Profissional inválido.' })
    try {
      const { rows } = await query(`SELECT a.email FROM professionals p
        LEFT JOIN professional_accounts a ON a.professional_id = p.id WHERE p.id = $1`, [request.params.id])
      if (!rows.length) return response.status(404).json({ error: 'Profissional não encontrado.' })
      response.json({ email: rows[0].email })
    } catch (error) { next(error) }
  })

  router.put('/professionals/:id/access', async (request, response, next) => {
    const email = request.body?.email?.trim().toLowerCase()
    if (!uuid.test(request.params.id) || typeof email !== 'string' || email.length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || Object.keys(request.body || {}).length !== 1)
      return response.status(400).json({ error: 'Informe o e-mail de uma conta Firebase existente.' })
    try {
      let account
      try { account = await directory().getUserByEmail(email) }
      catch (error) {
        if (error.code === 'auth/user-not-found') return response.status(404).json({ error: 'Essa conta ainda não foi cadastrada no app.' })
        throw error
      }
      if (account.disabled || account.customClaims?.admin === true)
        return response.status(409).json({ error: 'Esta conta não pode ser vinculada a um profissional.' })
      const { rows } = await query(`INSERT INTO professional_accounts (professional_id, firebase_uid, email)
        SELECT id, $2, $3 FROM professionals WHERE id = $1 AND ativo = true
        ON CONFLICT DO NOTHING RETURNING professional_id`, [request.params.id, account.uid, email])
      if (!rows.length) return response.status(409).json({ error: 'Profissional inativo ou conta já vinculada. Desvincule antes de alterar o acesso.' })
      try {
        await directory().setCustomUserClaims(account.uid, { ...account.customClaims, professional: true })
      } catch (error) {
        await query('DELETE FROM professional_accounts WHERE professional_id = $1 AND firebase_uid = $2', [request.params.id, account.uid])
        throw error
      }
      response.json({ email })
    } catch (error) { next(error) }
  })

  router.delete('/professionals/:id/access', async (request, response, next) => {
    if (!uuid.test(request.params.id)) return response.status(400).json({ error: 'Profissional inválido.' })
    try {
      const { rows } = await query('SELECT firebase_uid FROM professional_accounts WHERE professional_id = $1', [request.params.id])
      if (!rows.length) return response.status(404).json({ error: 'Este profissional não possui acesso vinculado.' })
      let account
      try { account = await directory().getUser(rows[0].firebase_uid) }
      catch (error) {
        if (error.code !== 'auth/user-not-found') throw error
        await query('DELETE FROM professional_accounts WHERE professional_id = $1 AND firebase_uid = $2', [request.params.id, rows[0].firebase_uid])
        return response.json({ removido: true })
      }
      const claims = { ...account.customClaims }
      delete claims.professional
      await directory().setCustomUserClaims(account.uid, claims)
      await query('DELETE FROM professional_accounts WHERE professional_id = $1 AND firebase_uid = $2', [request.params.id, account.uid])
      response.json({ removido: true })
    } catch (error) { next(error) }
  })

  router.get('/dashboard', async (_request, response, next) => {
    try {
      const { rows } = await query(`SELECT
        count(*) AS "totalHoje",
        count(*) FILTER (WHERE status = 'confirmado') AS "aguardandoHoje",
        count(*) FILTER (WHERE status = 'em_atendimento') AS "emAtendimentoHoje",
        count(*) FILTER (WHERE status = 'concluido') AS "concluidosHoje"
        FROM bookings
        WHERE (starts_at AT TIME ZONE 'America/Fortaleza')::date =
          (now() AT TIME ZONE 'America/Fortaleza')::date`)
      const summary = rows[0] || {}
      response.json({
        totalHoje: Number(summary.totalHoje || 0),
        aguardandoHoje: Number(summary.aguardandoHoje || 0),
        emAtendimentoHoje: Number(summary.emAtendimentoHoje || 0),
        concluidosHoje: Number(summary.concluidosHoje || 0),
      })
    } catch (error) { next(error) }
  })

  router.get('/bookings', async (request, response, next) => {
    const { status, offset = '0', period } = request.query
    if (status !== undefined && !['confirmado', 'em_atendimento', 'concluido', 'cancelado'].includes(status))
      return response.status(400).json({ error: 'Status inválido.' })
    if (period !== undefined && !['today', 'upcoming'].includes(period))
      return response.status(400).json({ error: 'Período inválido.' })
    if (typeof offset !== 'string' || !/^\d{1,6}$/.test(offset) || Number(offset) > 100000)
      return response.status(400).json({ error: 'Paginação inválida.' })
    const periodClause = period === 'today'
      ? `AND (b.starts_at AT TIME ZONE 'America/Fortaleza')::date =
          (now() AT TIME ZONE 'America/Fortaleza')::date`
      : period === 'upcoming' ? 'AND b.starts_at >= now()' : ''
    const direction = period ? 'ASC' : 'DESC'
    try {
      const { rows } = await query(`SELECT ${adminBookingFields}
        FROM bookings b JOIN services s ON s.id = b.service_id
        JOIN professionals p ON p.id = b.professional_id
        WHERE ($1::text IS NULL OR b.status = $1) ${periodClause}
        ORDER BY b.starts_at ${direction}, b.id ${direction} LIMIT 100 OFFSET $2`, [status ?? null, Number(offset)])
      response.json(rows)
    } catch (error) { next(error) }
  })

  router.get('/agenda', async (request, response, next) => {
    const { start, end, professionalId, serviceId, offset = '0' } = request.query
    const days = Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)
    if (!validDate(start) || !validDate(end) || days < 86400000 || days > 32 * 86400000 ||
        (professionalId !== undefined && (typeof professionalId !== 'string' || !uuid.test(professionalId))) ||
        (serviceId !== undefined && (typeof serviceId !== 'string' || !uuid.test(serviceId))) ||
        typeof offset !== 'string' || !/^\d{1,6}$/.test(offset) || Number(offset) > 100000)
      return response.status(400).json({ error: 'Confira período, filtros e paginação.' })
    try {
      const { rows } = await query(`SELECT ${adminBookingFields}
        FROM bookings b JOIN services s ON s.id = b.service_id
        JOIN professionals p ON p.id = b.professional_id
        WHERE b.starts_at >= ($1::date::timestamp AT TIME ZONE 'America/Fortaleza')
          AND b.starts_at < ($2::date::timestamp AT TIME ZONE 'America/Fortaleza')
          AND ($3::uuid IS NULL OR b.professional_id = $3)
          AND ($4::uuid IS NULL OR b.service_id = $4)
        ORDER BY b.starts_at ASC, b.id ASC LIMIT 100 OFFSET $5`,
      [start, end, professionalId ?? null, serviceId ?? null, Number(offset)])
      response.json(rows)
    } catch (error) { next(error) }
  })

  router.get('/bookings/:id', async (request, response, next) => {
    if (!uuid.test(request.params.id)) return response.status(400).json({ error: 'Agendamento inválido.' })
    try {
      const { rows } = await query(`SELECT ${adminBookingFields}
        FROM bookings b JOIN services s ON s.id = b.service_id
        JOIN professionals p ON p.id = b.professional_id WHERE b.id = $1`, [request.params.id])
      if (!rows.length) return response.status(404).json({ error: 'Agendamento não encontrado.' })
      response.json(rows[0])
    } catch (error) { next(error) }
  })

  router.patch('/bookings/:id/status', async (request, response, next) => {
    const { status } = request.body || {}
    const requiredPrevious = { em_atendimento: 'confirmado', concluido: 'em_atendimento', cancelado: 'confirmado' }
    if (!uuid.test(request.params.id) || !Object.hasOwn(requiredPrevious, status) || Object.keys(request.body || {}).length !== 1)
      return response.status(400).json({ error: 'Agendamento ou status inválido.' })
    try {
      const { rows } = await query(`UPDATE bookings SET status = $2
        WHERE id = $1 AND status = $3 RETURNING id, status`, [request.params.id, status, requiredPrevious[status]])
      if (!rows.length) return response.status(409).json({ error: 'O agendamento mudou de estado. Atualize a tela antes de continuar.' })
      response.json(rows[0])
    } catch (error) { next(error) }
  })

  router.get('/professionals/:id/hours', async (request, response, next) => {
    if (!uuid.test(request.params.id)) return response.status(400).json({ error: 'Profissional inválido.' })
    try {
      const professional = await query('SELECT id FROM professionals WHERE id = $1', [request.params.id])
      if (!professional.rows.length) return response.status(404).json({ error: 'Profissional não encontrado.' })
      const { rows } = await query(`SELECT weekday AS dia, to_char(opens_at, 'HH24:MI') AS abertura,
        to_char(closes_at, 'HH24:MI') AS fechamento
        FROM professional_hours WHERE professional_id = $1 ORDER BY weekday`, [request.params.id])
      response.json(rows)
    } catch (error) { next(error) }
  })

  router.put('/professionals/:id/hours/:weekday', async (request, response, next) => {
    const { abertura, fechamento } = request.body || {}
    if (!uuid.test(request.params.id) || !/^[1-7]$/.test(request.params.weekday) ||
        !validTime(abertura) || !validTime(fechamento) || minutes(abertura) >= minutes(fechamento) ||
        Object.keys(request.body || {}).length !== 2)
      return response.status(400).json({ error: 'Confira o dia e os horários de abertura e fechamento.' })
    try {
      const { rows } = await query(`INSERT INTO professional_hours (professional_id, weekday, opens_at, closes_at)
        SELECT id, $2, $3::time, $4::time FROM professionals WHERE id = $1
        ON CONFLICT (professional_id, weekday) DO UPDATE
          SET opens_at = EXCLUDED.opens_at, closes_at = EXCLUDED.closes_at
        RETURNING weekday AS dia, to_char(opens_at, 'HH24:MI') AS abertura,
          to_char(closes_at, 'HH24:MI') AS fechamento`,
      [request.params.id, Number(request.params.weekday), abertura, fechamento])
      if (!rows.length) return response.status(404).json({ error: 'Profissional não encontrado.' })
      response.json(rows[0])
    } catch (error) { next(error) }
  })

  router.delete('/professionals/:id/hours/:weekday', async (request, response, next) => {
    if (!uuid.test(request.params.id) || !/^[1-7]$/.test(request.params.weekday))
      return response.status(400).json({ error: 'Profissional ou dia inválido.' })
    try {
      const { rows } = await query(`DELETE FROM professional_hours WHERE professional_id = $1 AND weekday = $2
        RETURNING weekday AS dia`, [request.params.id, Number(request.params.weekday)])
      if (!rows.length) return response.status(404).json({ error: 'Horário não encontrado.' })
      response.json({ dia: rows[0].dia, removido: true })
    } catch (error) { next(error) }
  })

  for (const [table, spec] of Object.entries(specs)) {
    router.get(`/${table}`, async (_request, response, next) => {
      try {
        const { rows } = await query(`SELECT ${spec.projection} FROM ${table} ORDER BY ordem, nome`)
        response.json(rows)
      } catch (error) { next(error) }
    })

    router.post(`/${table}`, async (request, response, next) => {
      const fields = validatedFields(request.body, spec, true)
      if (!fields) return response.status(400).json({ error: 'Confira os campos do cadastro.' })
      const columns = fields.map(([column]) => column)
      const values = fields.map(([, value]) => value)
      try {
        const { rows } = await query(`INSERT INTO ${table} (${columns.join(', ')})
          VALUES (${fields.map((_, index) => `$${index + 1}`).join(', ')}) RETURNING ${spec.projection}`, values)
        response.status(201).json(rows[0])
      } catch (error) { catalogError(error, next, response) }
    })

    router.patch(`/${table}/:id`, async (request, response, next) => {
      if (!uuid.test(request.params.id)) return response.status(400).json({ error: 'Identificador inválido.' })
      const fields = validatedFields(request.body, spec, false)
      if (!fields) return response.status(400).json({ error: 'Confira os campos da alteração.' })
      const values = fields.map(([, value]) => value)
      const assignments = fields.map(([column], index) => `${column} = $${index + 1}`)
      try {
        const { rows } = await query(`UPDATE ${table} SET ${assignments.join(', ')}
          WHERE id = $${values.length + 1} RETURNING ${spec.projection}`, [...values, request.params.id])
        if (!rows.length) return response.status(404).json({ error: 'Cadastro não encontrado.' })
        response.json(rows[0])
      } catch (error) { catalogError(error, next, response) }
    })

    router.delete(`/${table}/:id`, async (request, response, next) => {
      if (!uuid.test(request.params.id)) return response.status(400).json({ error: 'Identificador inválido.' })
      try {
        const { rows } = await query(`DELETE FROM ${table} WHERE id = $1 RETURNING id`, [request.params.id])
        if (!rows.length) return response.status(404).json({ error: 'Cadastro não encontrado.' })
        response.json({ id: rows[0].id, excluido: true })
      } catch (error) {
        if (error.code === '23503')
          return response.status(409).json({ error: 'Este cadastro possui agendamentos ou acesso vinculado e não pode ser excluído. Desative-o para preservar o histórico.' })
        next(error)
      }
    })
  }

  return router
}
