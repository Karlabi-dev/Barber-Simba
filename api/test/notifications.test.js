import test from 'node:test'
import assert from 'node:assert/strict'
import { createApp } from '../src/app.js'

test('avisos exigem token, pertencem ao usuário e podem ser marcados como lidos', async () => {
  const calls = []
  const bookingId = 'ea93f53c-84e8-4e2d-886a-b0b4f1aa316a'
  const query = async (sql, params) => {
    calls.push({ sql, params })
    if (sql.includes('SELECT n.id')) return { rows: [{
      id: 'event-1', bookingId, type: 'cancelled', createdAt: '2026-10-05T12:00:00Z', read: false,
      servico: 'Corte', profissional: 'Ana', data: '05/10/2026', horario: '15:00',
    }] }
    if (sql.includes('UPDATE customer_notifications')) return { rowCount: 1 }
    return { rows: [] }
  }
  const app = createApp(query, async token => token === 'valid' ? { uid: 'cliente-1' } : null)
  const server = app.listen(0)
  const base = `http://127.0.0.1:${server.address().port}`
  try {
    assert.equal((await fetch(`${base}/api/notifications`)).status, 401)
    assert.equal((await fetch(`${base}/api/notifications`, { headers: { Authorization: 'Bearer wrong' } })).status, 401)
    const response = await fetch(`${base}/api/notifications`, { headers: { Authorization: 'Bearer valid' } })
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), [{
      id: 'event-1', bookingId, type: 'cancelled', createdAt: '2026-10-05T12:00:00Z', read: false,
      title: 'Agendamento cancelado', message: 'Corte com Ana, 05/10/2026 às 15:00.',
    }])
    assert.equal((await fetch(`${base}/api/notifications/read`, { method: 'PATCH' })).status, 401)
    const marked = await fetch(`${base}/api/notifications/read`, { method: 'PATCH', headers: { Authorization: 'Bearer valid' } })
    assert.deepEqual(await marked.json(), { updated: 1 })
    assert.deepEqual(calls.map(call => call.params), [['cliente-1'], ['cliente-1'], ['cliente-1']])
    assert.match(calls[0].sql, /reminder_day.*America\/Fortaleza.*interval '1 hour'/s)
    assert.match(calls[0].sql, /ON CONFLICT \(booking_id, type\) DO NOTHING/)
    assert.match(calls[1].sql, /n\.firebase_uid = \$1/)
    assert.match(calls[2].sql, /firebase_uid = \$1/)
  } finally { await new Promise(resolve => server.close(resolve)) }
})
