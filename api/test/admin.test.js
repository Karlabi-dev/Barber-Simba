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
    const paths = ['/api/admin/bookings', '/api/admin/services', '/api/admin/professionals', '/api/admin/dashboard']
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

test('painel resume o dia de Fortaleza e filtra agenda sem aceitar período arbitrário', async () => {
  const calls = []
  const { base, close } = await serve(async (sql, params) => {
    calls.push({ sql, params })
    return sql.includes('count(*) AS "totalHoje"')
      ? { rows: [{ totalHoje: '4', aguardandoHoje: '2', concluidosHoje: '1' }] }
      : { rows: [{ id, status: 'confirmado' }] }
  })
  try {
    const dashboard = await fetch(`${base}/api/admin/dashboard`, { headers: headers('admin') })
    assert.equal(dashboard.status, 200)
    assert.deepEqual(await dashboard.json(), { totalHoje: 4, aguardandoHoje: 2, concluidosHoje: 1 })
    assert.match(calls[0].sql, /America\/Fortaleza/)

    const today = await fetch(`${base}/api/admin/bookings?period=today`, { headers: headers('admin') })
    assert.equal(today.status, 200)
    assert.match(calls[1].sql, /America\/Fortaleza/)
    assert.match(calls[1].sql, /ORDER BY b.starts_at ASC/)

    const upcoming = await fetch(`${base}/api/admin/bookings?period=upcoming&status=confirmado`, { headers: headers('admin') })
    assert.equal(upcoming.status, 200)
    assert.deepEqual(calls[2].params, ['confirmado', 0])
    assert.match(calls[2].sql, /b.starts_at >= now\(\)/)
    assert.equal((await fetch(`${base}/api/admin/bookings?period=tomorrow`, { headers: headers('admin') })).status, 400)
    assert.equal(calls.length, 3)
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

test('exclusão administrativa preserva cadastros ligados a agendamentos', async () => {
  const calls = []
  let outcome = 'deleted'
  const { base, close } = await serve(async (sql, params) => {
    calls.push({ sql, params })
    if (outcome === 'booked') throw Object.assign(new Error('referenced'), { code: '23503' })
    return { rows: outcome === 'missing' ? [] : [{ id }] }
  })
  try {
    const service = `${base}/api/admin/services/${id}`
    const professional = `${base}/api/admin/professionals/${id}`
    assert.equal((await fetch(service, { method: 'DELETE', headers: headers('user') })).status, 403)
    assert.equal((await fetch(`${base}/api/admin/services/invalido`, { method: 'DELETE', headers: headers('admin') })).status, 400)
    assert.equal(calls.length, 0)

    const removed = await fetch(service, { method: 'DELETE', headers: headers('admin') })
    assert.equal(removed.status, 200)
    assert.deepEqual(await removed.json(), { id, excluido: true })
    assert.match(calls[0].sql, /^DELETE FROM services WHERE id = \$1 RETURNING id$/)
    assert.deepEqual(calls[0].params, [id])

    outcome = 'booked'
    const blocked = await fetch(professional, { method: 'DELETE', headers: headers('admin') })
    assert.equal(blocked.status, 409)
    assert.match((await blocked.json()).error, /agendamentos.*Desative/)
    assert.match(calls[1].sql, /^DELETE FROM professionals WHERE id = \$1 RETURNING id$/)

    outcome = 'missing'
    assert.equal((await fetch(professional, { method: 'DELETE', headers: headers('admin') })).status, 404)
  } finally { await close() }
})
