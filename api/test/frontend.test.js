import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { createApp } from '../src/app.js'
import { mountFrontend } from '../src/frontend.js'

test('o serviço publicado entrega a SPA e mantém as rotas da API separadas', async t => {
  const directory = mkdtempSync(path.join(tmpdir(), 'simba-web-'))
  t.after(() => rmSync(directory, { recursive: true, force: true }))
  writeFileSync(path.join(directory, 'index.html'), '<!doctype html><title>Simba</title>')
  writeFileSync(path.join(directory, 'app.js'), 'export const ready = true')

  const app = createApp(async () => ({ rows: [] }))
  mountFrontend(app, directory)
  const server = app.listen(0)
  t.after(() => server.close())
  const base = `http://127.0.0.1:${server.address().port}`

  const page = await fetch(`${base}/profissional/agenda`)
  assert.equal(page.status, 200)
  assert.match(await page.text(), /<title>Simba<\/title>/)
  const asset = await fetch(`${base}/app.js`)
  assert.match(await asset.text(), /ready = true/)
  const health = await fetch(`${base}/api/health`)
  assert.deepEqual(await health.json(), { status: 'ok' })
  const unknownApi = await fetch(`${base}/api/inexistente`)
  assert.equal(unknownApi.status, 404)
  assert.match(unknownApi.headers.get('content-type'), /json/)
  assert.equal((await fetch(`${base}/arquivo-inexistente.js`)).status, 404)
})
