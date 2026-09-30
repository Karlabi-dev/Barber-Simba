import { initializeApp, getApps } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

export async function verifyFirebaseToken(token) {
  if (!getApps().length) initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID || 'barber-simba' })
  const decoded = await getAuth().verifyIdToken(token)
  return decoded.uid
}

export function requireUser(verifyToken = verifyFirebaseToken) {
  return async (request, response, next) => {
    const match = /^Bearer (\S+)$/i.exec(request.get('authorization') || '')
    if (!match) return response.status(401).json({ error: 'Entre na sua conta para continuar.' })
    try {
      request.uid = await verifyToken(match[1])
      if (!request.uid) return response.status(401).json({ error: 'Sessão inválida. Entre novamente.' })
      next()
    } catch {
      response.status(401).json({ error: 'Sessão inválida. Entre novamente.' })
    }
  }
}
