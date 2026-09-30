import test from 'node:test'
import assert from 'node:assert/strict'
import { createApp } from '../src/app.js'

test('catálogo público retorna dados do banco e consulta sem credenciais no navegador', async () => {
  const statements = []
  const app = createApp(async sql => {
    statements.push(sql)
    return { rows: sql.includes('FROM services')
      ? [{ id: 'service-id', slug: 'corte-premium', nome: 'Corte Premium', preco: '45.00', iconKey: 'tesoura' }]
      : [{ id: 'professional-id', slug: 'allander', nome: 'Allander', imageKey: 'allander' }] }
  })
  const server = app.listen(0)
  try {
    const base = `http://127.0.0.1:${server.address().port}`
    const services = await fetch(`${base}/api/services`)
    const professionals = await fetch(`${base}/api/professionals`)
    assert.equal(services.status, 200)
    assert.equal(professionals.status, 200)
    assert.equal((await services.json())[0].slug, 'corte-premium')
    assert.equal((await professionals.json())[0].imageKey, 'allander')
    assert.ok(statements.some(sql => sql.includes('WHERE ativo = true')))
  } finally {
    await new Promise(resolve => server.close(resolve))
  }
})
