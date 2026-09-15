import { getApp, getApps, initializeApp } from 'firebase/app'
import { browserSessionPersistence, getAuth, setPersistence } from 'firebase/auth'

// Configuração pública do aplicativo web (não é uma credencial administrativa).
const firebaseConfig = {
  apiKey: 'AIzaSyD_er-KBKg0ZefpffUpZMg5A9y2kqaU9aA',
  authDomain: 'barber-simba.firebaseapp.com',
  projectId: 'barber-simba',
  storageBucket: 'barber-simba.firebasestorage.app',
  messagingSenderId: '1016329930409',
  appId: '1:1016329930409:web:ea86e24450f7565acc4bb8',
}

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig)
export const auth = getAuth(firebaseApp)
auth.languageCode = 'pt-BR'

// A sessão dura enquanto a aba estiver aberta, apropriado também a PCs compartilhados.
// Resultado resolvido evita rejeição não tratada antes de o Provider iniciar.
export const authReady = setPersistence(auth, browserSessionPersistence)
  .then(() => ({ error: null }), error => ({ error }))
