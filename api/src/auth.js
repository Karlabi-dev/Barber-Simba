import { initializeApp, getApps } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

export async function verifyFirebaseToken(token) {
  if (!getApps().length) initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID || 'barber-simba' })
  return getAuth().verifyIdToken(token)
}

export function requireUser(verifyToken = verifyFirebaseToken) {
  return async (request, response, next) => {
    const match = /^Bearer (\S+)$/i.exec(request.get('authorization') || '')
    if (!match) return response.status(401).json({ error: 'Entre na sua conta para continuar.' })
    try {
      const claims = await verifyToken(match[1])
      if (!claims || typeof claims.uid !== 'string' || !claims.uid)
        return response.status(401).json({ error: 'Sessão inválida. Entre novamente.' })
      request.uid = claims.uid
      request.claims = claims
      next()
    } catch {
      response.status(401).json({ error: 'Sessão inválida. Entre novamente.' })
    }
  }
}

export function requireAdmin(request, response, next) {
  if (request.claims?.admin !== true)
    return response.status(403).json({ error: 'Acesso administrativo necessário.' })
  next()
}
