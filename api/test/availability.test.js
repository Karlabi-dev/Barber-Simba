import test from 'node:test'
import assert from 'node:assert/strict'
import { createApp } from '../src/app.js'
import { availableTimes } from '../src/availability.js'

const id = 'ea93f53c-84e8-4e2d-886a-b0b4f1aa316a'
const date = '2099-09-30'
const admin = { Authorization: 'Bearer admin', 'Content-Type': 'application/json' }

async function serve(query) {
  const app = createApp(query, async token => ({ uid: 'user', admin: token === 'admin' }))
  const server = app.listen(0)
  return { base: `http://127.0.0.1:${server.address().port}`,
    close: () => new Promise(resolve => server.close(resolve)) }
}

test('intervalos de 30 minutos respeitam abertura, fechamento, duração e ocupação', () => {
  const slots = availableTimes({ date, duration: 30, opensAt: '08:00:00', closesAt: '18:00:00',
    occupied: [{ inicio: 540, fim: 570 }], now: new Date('2026-09-30T12:00:00Z') })
  assert.equal(slots.length, 19)
  assert.equal(slots[0], '08:00')
  assert.ok(!slots.includes('09:00'))
  assert.equal(slots.at(-1), '17:30')

  const longer = availableTimes({ date, duration: 75, opensAt: '08:00', closesAt: '10:00',
    occupied: [{ inicio: 570, fim: 600 }], now: new Date('2026-09-30T12:00:00Z') })
  assert.deepEqual(longer, ['08:00'])
})

test('disponibilidade pública consulta agenda e reservas; dia fechado retorna lista vazia', async () => {
  const calls = []
  let closed = false
  const { base, close } = await serve(async (sql, params) => {
    calls.push({ sql, params })
    if (sql.includes('FROM bookings b WHERE')) return { rows: [{ inicio: 480, fim: 510 }] }
    return { rows: [{ professionalId: id, duracao: 30, opensAt: closed ? null : '08:00:00', closesAt: '18:00:00' }] }
  })
  try {
    const query = new URLSearchParams({ serviceSlug: 'corte-premium', professionalSlug: 'allander', data: date })
    const open = await fetch(`${base}/api/availability?${query}`)
    assert.equal(open.status, 200)
    const result = await open.json()
    assert.equal(result.horarios[0], '08:30')
    assert.equal(result.horarios.at(-1), '17:30')
    assert.deepEqual(calls[1].params, [id, date])
    assert.match(calls[0].sql, /EXTRACT\(ISODOW/)
    assert.match(calls[1].sql, /status IN \('confirmado', 'em_atendimento'\)/)

    closed = true
    assert.deepEqual((await (await fetch(`${base}/api/availability?${query}`)).json()).horarios, [])
    assert.equal(calls.length, 3)
    assert.equal((await fetch(`${base}/api/availability?${new URLSearchParams({ ...Object.fromEntries(query), data: '2026-02-31' })}`)).status, 400)
  } finally { await close() }
})

test('agendamento usa a agenda semanal e duração, rejeitando intervalos ocupados', async () => {
  const calls = []
  let conflict = false
  const { base, close } = await serve(async (sql, params) => {
    calls.push({ sql, params })
    if (conflict) { const error = new Error('overlap'); error.code = '23P01'; throw error }
    return { rows: [{ id }] }
  })
  try {
    const payload = { serviceSlug: 'corte-premium', professionalSlug: 'allander', data: date, horario: '08:00' }
    const request = body => fetch(`${base}/api/bookings`, { method: 'POST', headers: admin, body: JSON.stringify(body) })
    assert.equal((await request({ ...payload, horario: '08:15' })).status, 400)
    assert.equal((await request(payload)).status, 201)
    assert.match(calls[0].sql, /INSERT INTO bookings .*ends_at/)
    assert.match(calls[0].sql, /JOIN professional_hours/)
    assert.match(calls[0].sql, /ph\.closes_at/)
    conflict = true
    assert.equal((await request(payload)).status, 409)
  } finally { await close() }
})

test('somente admin altera dias e horário de um profissional', async () => {
  const calls = []
  const { base, close } = await serve(async (sql, params) => {
    calls.push({ sql, params })
    return { rows: [{ dia: 1, abertura: '08:00', fechamento: '18:00' }] }
  })
  try {
    const path = `${base}/api/admin/professionals/${id}/hours/1`
    const body = JSON.stringify({ abertura: '08:00', fechamento: '18:00' })
    assert.equal((await fetch(path, { method: 'PUT', headers: { ...admin, Authorization: 'Bearer user' }, body })).status, 403)
    assert.equal((await fetch(path, { method: 'PUT', headers: admin,
      body: JSON.stringify({ abertura: '18:00', fechamento: '08:00' }) })).status, 400)
    assert.equal((await fetch(path, { method: 'PUT', headers: admin, body })).status, 200)
    assert.deepEqual(calls[0].params, [id, 1, '08:00', '18:00'])
    assert.equal((await fetch(path, { method: 'DELETE', headers: admin })).status, 200)
    assert.equal((await fetch(`${base}/api/admin/professionals/${id}/hours`, { headers: admin })).status, 200)
    assert.equal(calls.length, 4)
  } finally { await close() }
})
