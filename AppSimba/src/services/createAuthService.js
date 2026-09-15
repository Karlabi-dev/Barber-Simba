// SDK recebido como dependência para testar sem criar contas reais.
export function createAuthService({ auth, ready, sdk }) {
  async function ensureReady() {
    const result = await ready
    if (result.error) throw result.error
  }
  return {
    async cadastrar(email, senha) {
      await ensureReady()
      return (await sdk.createUserWithEmailAndPassword(auth, email.trim(), senha)).user
    },
    async entrar(email, senha) {
      await ensureReady()
      return (await sdk.signInWithEmailAndPassword(auth, email.trim(), senha)).user
    },
    async sair() {
      // Permitir logout mesmo se a configuração de persistência falhar.
      await sdk.signOut(auth)
    },
    observar(callback, onError) {
      return sdk.onAuthStateChanged(auth, callback, onError)
    },
  }
}
