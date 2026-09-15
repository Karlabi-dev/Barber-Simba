// SDK recebido como dependência para testar sem criar contas reais.
export function createAuthService({ auth, ready, sdk }) {
  async function ensureReady() {
    const result = await ready
    if (result.error) throw result.error
  }
  return {
    async cadastrar(email, senha, nome = '') {
      await ensureReady()
      const { user } = await sdk.createUserWithEmailAndPassword(auth, email.trim(), senha)
      try {
        if (nome.trim()) await sdk.updateProfile(user, { displayName: nome.trim() })
        return user
      } catch (cause) {
        const error = new Error('Conta criada, mas não foi possível salvar o nome. Entre com o e-mail e senha cadastrados.')
        error.code = 'auth/profile-save-failed'
        error.cause = cause
        throw error
      } finally {
        // Cadastro não mantém sessão: o usuário deve entrar pela tela de login.
        await sdk.signOut(auth)
      }
    },
    async entrar(email, senha) {
      await ensureReady()
      return (await sdk.signInWithEmailAndPassword(auth, email.trim(), senha)).user
    },
    async sair() {
      // Permitir logout mesmo se a configuração de persistência falhar.
      await sdk.signOut(auth)
      if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem('simba-booking')
    },
    async recuperarSenha(email) {
      await ensureReady()
      await sdk.sendPasswordResetEmail(auth, email.trim())
    },
    async verificarRedefinicao(code) {
      await ensureReady()
      return sdk.verifyPasswordResetCode(auth, code)
    },
    async redefinirSenha(code, senha) {
      await ensureReady()
      await sdk.confirmPasswordReset(auth, code, senha)
    },
    observar(callback, onError) {
      return sdk.onAuthStateChanged(auth, callback, onError)
    },
  }
}
