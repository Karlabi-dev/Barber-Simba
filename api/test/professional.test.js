import test from 'node:test'
import assert from 'node:assert/strict'
import { createApp } from '../src/app.js'

const professionalId = 'ea93f53c-84e8-4e2d-886a-b0b4f1aa316a'
const bookingId = 'de586b8d-4243-481c-9917-1b96792a5ee3'
const headers = token => ({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' })

async function serve(query, directory = {}) {
  const verify = async token => ({
    admin: { uid: 'owner', admin: true },
    professional: { uid: 'barber-uid', professional: true },
    customer: { uid: 'customer', professional: false },
    stale: { uid: 'stale-uid', professional: true },
  })[token] || null
  const server = createApp(query, verify, directory).listen(0)
  return { base: `http://127.0.0.1:${server.address().port}`, close: () => new Promise(resolve => server.close(resolve)) }
}

test('profissional só consulta a própria agenda e só inicia/finaliza os próprios atendimentos', async () => {
  const calls = []
  const { base, close } = await serve(async (sql, params) => {
    calls.push({ sql, params })
    if (sql.includes('FROM professional_accounts a JOIN professionals p'))
      return { rows: params[0] === 'barber-uid' ? [{ id: professionalId, nome: 'Allander' }] : [] }
    if (sql.includes('UPDATE bookings')) return { rows: [{ id: bookingId, status: params[2] }] }
    return { rows: [{ id: bookingId, status: 'confirmado' }] }
  })
  try {
    const path = `/api/professional/bookings?start=2026-09-30&end=2026-10-01`
    assert.equal((await fetch(base + path)).status, 401)
    assert.equal((await fetch(base + path, { headers: headers('customer') })).status, 403)
    assert.equal((await fetch(base + path, { headers: headers('stale') })).status, 403)
    assert.equal((await fetch(base + path, { headers: headers('professional') })).status, 200)
    const list = calls.at(-1)
    assert.match(list.sql, /b.professional_id = \$1/)
    assert.deepEqual(list.params, [professionalId, '2026-09-30', '2026-10-01', null, 0])
    assert.equal((await fetch(`${base}/api/professional/bookings?start=2026-09-30&end=2026-12-01`, { headers: headers('professional') })).status, 400)
    const statusUrl = `${base}/api/professional/bookings/${bookingId}/status`
    assert.equal((await fetch(statusUrl, { method: 'PATCH', headers: headers('professional'), body: JSON.stringify({ status: 'cancelado' }) })).status, 400)
    assert.equal((await fetch(statusUrl, { method: 'DELETE', headers: headers('professional') })).status, 404)
    assert.equal((await fetch(statusUrl, { method: 'PATCH', headers: headers('professional'), body: JSON.stringify({ status: 'em_atendimento' }) })).status, 200)
    const update = calls.at(-1)
    assert.match(update.sql, /professional_id = \$2 AND status = \$4/)
    assert.deepEqual(update.params, [bookingId, professionalId, 'em_atendimento', 'confirmado'])
    assert.equal((await fetch(statusUrl, { method: 'PATCH', headers: headers('professional'), body: JSON.stringify({ status: 'concluido' }) })).status, 200)
    assert.deepEqual(calls.at(-1).params, [bookingId, professionalId, 'concluido', 'em_atendimento'])
  } finally { await close() }
})

test('admin vincula conta existente sem criar senha e pode remover somente o acesso do profissional', async () => {
  const claims = []
  let linked = false
  const directory = {
    async getUserByEmail(email) {
      if (email === 'admin@example.com') return { uid: 'owner', customClaims: { admin: true } }
      if (email === 'missing@example.com') throw Object.assign(new Error('missing'), { code: 'auth/user-not-found' })
      return { uid: 'barber-uid', customClaims: { other: 'preserved' } }
    },
    async getUser(uid) { return { uid, customClaims: { other: 'preserved', professional: true } } },
    async setCustomUserClaims(uid, value) { claims.push({ uid, value }) },
  }
  const { base, close } = await serve(async (sql, params) => {
    if (sql.includes('INSERT INTO professional_accounts')) { linked = true; return { rows: [{ professional_id: professionalId }] } }
    if (sql.includes('SELECT firebase_uid FROM professional_accounts')) return { rows: linked ? [{ firebase_uid: 'barber-uid' }] : [] }
    if (sql.includes('DELETE FROM professional_accounts')) { linked = false; return { rows: [] } }
    return { rows: [{ email: linked ? 'barber@example.com' : null }] }
  }, directory)
  try {
    const path = `${base}/api/admin/professionals/${professionalId}/access`
    assert.equal((await fetch(path, { method: 'PUT', headers: headers('customer'), body: JSON.stringify({ email: 'barber@example.com' }) })).status, 403)
    assert.equal((await fetch(path, { method: 'PUT', headers: headers('admin'), body: JSON.stringify({ email: 'missing@example.com' }) })).status, 404)
    assert.equal((await fetch(path, { method: 'PUT', headers: headers('admin'), body: JSON.stringify({ email: 'admin@example.com' }) })).status, 409)
    assert.equal((await fetch(path, { method: 'PUT', headers: headers('admin'), body: JSON.stringify({ email: 'barber@example.com' }) })).status, 200)
    assert.deepEqual(claims[0], { uid: 'barber-uid', value: { other: 'preserved', professional: true } })
    assert.equal((await fetch(path, { method: 'DELETE', headers: headers('admin') })).status, 200)
    assert.deepEqual(claims[1], { uid: 'barber-uid', value: { other: 'preserved' } })
  } finally { await close() }
})
