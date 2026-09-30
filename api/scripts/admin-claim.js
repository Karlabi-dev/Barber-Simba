import 'dotenv/config'
import { applicationDefault, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

const [action, uid, ...extra] = process.argv.slice(2)
if (!['grant', 'revoke'].includes(action) || !uid || uid.length > 128 || extra.length) {
  console.error('Uso: npm run admin:claim -- <grant|revoke> <Firebase UID>')
  process.exitCode = 1
} else if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error('Defina GOOGLE_APPLICATION_CREDENTIALS com o caminho local da conta de serviço Firebase.')
  process.exitCode = 1
} else {
  try {
    initializeApp({ credential: applicationDefault(), projectId: process.env.FIREBASE_PROJECT_ID || 'barber-simba' })
    const auth = getAuth()
    const user = await auth.getUser(uid)
    const claims = { ...user.customClaims }
    if (action === 'grant') claims.admin = true
    else delete claims.admin
    await auth.setCustomUserClaims(uid, claims)
    console.log(`Permissão administrativa ${action === 'grant' ? 'atribuída' : 'removida'} para UID ${uid}.`)
    console.log('O usuário precisa atualizar o ID token para refletir a alteração.')
  } catch (error) {
    console.error('Não foi possível atualizar a permissão:', error.message)
    process.exitCode = 1
  }
}
