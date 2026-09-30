import test from 'node:test'
import assert from 'node:assert/strict'
import { createApp } from '../src/app.js'

test('agendamentos exigem token e vinculam criação, listagem e cancelamento ao uid verificado', async () => {
  const calls = []
  const booking = { id: 'ea93f53c-84e8-4e2d-886a-b0b4f1aa316a', profissional: 'Allander', servico: 'Corte Premium' }
  const app = createApp(async (sql, params) => {
    calls.push({ sql, params })
    if (sql.includes('INSERT INTO bookings')) return { rows: [booking] }
    if (sql.includes('UPDATE bookings')) return { rows: [{ id: booking.id }] }
    return { rows: [booking] }
  }, async token => token === 'valid' ? { uid: 'firebase-user-1' } : null)
  const server = app.listen(0)
  const base = `http://127.0.0.1:${server.address().port}`
  const auth = { Authorization: 'Bearer valid' }
  try {
    assert.equal((await fetch(`${base}/api/bookings`)).status, 401)
    assert.equal((await fetch(`${base}/api/bookings`, { headers: { Authorization: 'Bearer invalid' } })).status, 401)

    const invalid = await fetch(`${base}/api/bookings`, { method: 'POST', headers: { ...auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({ serviceSlug: 'corte-premium', professionalSlug: 'allander', data: '2026-02-31', horario: '10:00' }) })
    assert.equal(invalid.status, 400)

    const future = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
    const created = await fetch(`${base}/api/bookings`, { method: 'POST', headers: { ...auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({ serviceSlug: 'corte-premium', professionalSlug: 'allander', data: future, horario: '15:00' }) })
    assert.equal(created.status, 201)
    assert.equal((await created.json()).id, booking.id)
    assert.equal((await fetch(`${base}/api/bookings`, { headers: auth })).status, 200)
    assert.equal((await fetch(`${base}/api/bookings/${booking.id}/cancel`, { method: 'PATCH', headers: auth })).status, 200)
    assert.deepEqual(calls.map(({ params }) => params[0]), ['firebase-user-1', 'firebase-user-1', booking.id])
    assert.equal(calls[2].params[1], 'firebase-user-1')
  } finally { await new Promise(resolve => server.close(resolve)) }
})

test('horário já reservado retorna conflito sem criar outro agendamento', async () => {
  const app = createApp(async () => { const error = new Error('unique'); error.code = '23505'; throw error }, async () => ({ uid: 'user' }))
  const server = app.listen(0)
  try {
    const base = `http://127.0.0.1:${server.address().port}`
    const data = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
    const response = await fetch(`${base}/api/bookings`, { method: 'POST', headers: { Authorization: 'Bearer token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ serviceSlug: 'corte-premium', professionalSlug: 'allander', data, horario: '15:00' }) })
    assert.equal(response.status, 409)
    assert.match((await response.json()).error, /já foi reservado/)
  } finally { await new Promise(resolve => server.close(resolve)) }
})
