import test from 'node:test'
import assert from 'node:assert/strict'
import { createApp } from '../src/app.js'

const id = 'ea93f53c-84e8-4e2d-886a-b0b4f1aa316a'
const headers = token => ({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' })

async function serve(query) {
  const app = createApp(query, async token => token === 'admin'
    ? { uid: 'owner', admin: true }
    : token === 'user' ? { uid: 'customer', admin: false }
      : token === 'string-claim' ? { uid: 'customer', admin: 'true' } : null)
  const server = app.listen(0)
  return { base: `http://127.0.0.1:${server.address().port}`, close: () => new Promise(resolve => server.close(resolve)) }
}

test('todas as rotas administrativas exigem token e claim admin booleana', async () => {
  const calls = []
  const { base, close } = await serve(async sql => { calls.push(sql); return { rows: [] } })
  try {
    const paths = ['/api/admin/bookings', '/api/admin/services', '/api/admin/professionals']
    for (const path of paths) {
      assert.equal((await fetch(base + path)).status, 401)
      assert.equal((await fetch(base + path, { headers: headers('user') })).status, 403)
      assert.equal((await fetch(base + path, { headers: headers('string-claim') })).status, 403)
      assert.equal((await fetch(base + path, { headers: headers('admin') })).status, 200)
    }
    assert.equal(calls.length, paths.length)
    assert.ok(calls[1].includes('FROM services ORDER BY'))
  } finally { await close() }
})

test('admin consulta agendamentos por status e só encerra agendamento confirmado', async () => {
  const calls = []
  const { base, close } = await serve(async (sql, params) => {
    calls.push({ sql, params })
    return { rows: sql.includes('UPDATE bookings') ? [{ id, status: params[1] }] : [{ id, status: 'confirmado' }] }
  })
  try {
    const list = await fetch(`${base}/api/admin/bookings?status=confirmado&offset=100`, { headers: headers('admin') })
    assert.equal(list.status, 200)
    assert.deepEqual(calls[0].params, ['confirmado', 100])
    assert.match(calls[0].sql, /LIMIT 100/)
    assert.equal((await fetch(`${base}/api/admin/bookings?status=invalido`, { headers: headers('admin') })).status, 400)
    assert.equal((await fetch(`${base}/api/admin/bookings?offset=-1`, { headers: headers('admin') })).status, 400)
    assert.equal((await fetch(`${base}/api/admin/bookings/${id}/status`, {
      method: 'PATCH', headers: headers('admin'), body: JSON.stringify({ status: 'confirmado' })
    })).status, 400)
    const updated = await fetch(`${base}/api/admin/bookings/${id}/status`, {
      method: 'PATCH', headers: headers('admin'), body: JSON.stringify({ status: 'concluido' })
    })
    assert.equal(updated.status, 200)
    assert.deepEqual(calls[1].params, [id, 'concluido'])
    assert.match(calls[1].sql, /status = 'confirmado'/)
  } finally { await close() }
})

test('catálogo valida entradas, usa parâmetros e permite desativação sem apagar registros', async () => {
  const calls = []
  const { base, close } = await serve(async (sql, params) => {
    calls.push({ sql, params })
    return { rows: [{ id, slug: 'corte-novo', ativo: params?.[0] !== false }] }
  })
  try {
    const path = `${base}/api/admin/services`
    const service = { slug: 'corte-novo', nome: 'Novo corte', categoria: 'Cabelo', preco: '55.00', duracao: 45 }
    assert.equal((await fetch(path, { method: 'POST', headers: headers('user'), body: JSON.stringify(service) })).status, 403)
    assert.equal((await fetch(path, { method: 'POST', headers: headers('admin'), body: JSON.stringify({ ...service, preco: -1 }) })).status, 400)
    assert.equal((await fetch(path, { method: 'POST', headers: headers('admin'), body: JSON.stringify({ ...service, 'ativo = false': true }) })).status, 400)
    assert.equal((await fetch(path, { method: 'POST', headers: headers('admin'), body: JSON.stringify(service) })).status, 201)
    assert.ok(calls[0].sql.includes('INSERT INTO services'))
    assert.deepEqual(calls[0].params, Object.values(service))
    const inactive = await fetch(`${path}/${id}`, { method: 'PATCH', headers: headers('admin'), body: JSON.stringify({ ativo: false }) })
    assert.equal(inactive.status, 200)
    assert.deepEqual(calls[1].params, [false, id])
    assert.match(calls[1].sql, /UPDATE services SET ativo = \$1/)
    assert.equal((await fetch(`${base}/api/admin/professionals`, {
      method: 'POST', headers: headers('admin'), body: JSON.stringify({ slug: 'alguem', nome: 'Alguém' })
    })).status, 201)
  } finally { await close() }
})
