import 'dotenv/config'
import pg from 'pg'
import { applicationDefault, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

if (!process.env.DATABASE_URL_UNPOOLED) throw new Error('Configure DATABASE_URL_UNPOOLED com a branch de desenvolvimento.')
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) throw new Error('Configure GOOGLE_APPLICATION_CREDENTIALS com a chave Firebase Admin.')

initializeApp({ credential: applicationDefault(), projectId: process.env.FIREBASE_PROJECT_ID || 'barber-simba' })
const client = new pg.Client({ connectionString: process.env.DATABASE_URL_UNPOOLED })
let updated = 0
try {
  await client.connect()
  const { rows } = await client.query("SELECT DISTINCT firebase_uid FROM bookings WHERE customer_name = ''")
  for (let index = 0; index < rows.length; index += 100) {
    const batch = rows.slice(index, index + 100)
    const found = await getAuth().getUsers(batch.map(row => ({ uid: row.firebase_uid })))
    for (const user of found.users) {
      const name = user.displayName?.trim().slice(0, 120)
      if (!name) continue
      const result = await client.query("UPDATE bookings SET customer_name = $2 WHERE firebase_uid = $1 AND customer_name = ''", [user.uid, name])
      updated += result.rowCount
    }
  }
  console.log(`Nomes preenchidos em ${updated} agendamento(s).`)
} finally {
  await client.end()
}
