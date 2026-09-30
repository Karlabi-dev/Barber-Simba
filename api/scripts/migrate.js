import 'dotenv/config'
import { readFile, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import pg from 'pg'

const url = process.env.DATABASE_URL_UNPOOLED
if (!url) throw new Error('Configure DATABASE_URL_UNPOOLED (conexão direta) antes da migração.')

const directory = join(dirname(fileURLToPath(import.meta.url)), '../migrations')
const client = new pg.Client({ connectionString: url })
try {
  await client.connect()
  await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now()
  )`)
  const files = (await readdir(directory)).filter(name => name.endsWith('.sql')).sort()
  for (const name of files) {
    const existing = await client.query('SELECT 1 FROM schema_migrations WHERE name = $1', [name])
    if (existing.rowCount) continue
    await client.query('BEGIN')
    try {
      await client.query(await readFile(join(directory, name), 'utf8'))
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [name])
      await client.query('COMMIT')
      console.log(`Aplicada: ${name}`)
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    }
  }
} finally {
  await client.end()
}
