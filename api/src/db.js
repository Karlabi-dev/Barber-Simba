import pg from 'pg'

let pool

export function getPool() {
  if (!process.env.DATABASE_URL) throw new Error('Configure DATABASE_URL no servidor.')
  if (!pool) pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 5 })
  return pool
}
