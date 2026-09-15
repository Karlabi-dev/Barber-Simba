import test from 'node:test'
import assert from 'node:assert/strict'
import { createAuthService } from '../src/services/createAuthService.js'
import { authErrorMessage } from '../src/services/authErrors.js'

test('redefinição só conclui após confirmação do Firebase e preserva senha', async () => {
  let finish
  let completed = false
  const service = createAuthService({ auth: {}, ready: Promise.resolve({error:null}), sdk: {
    async verifyPasswordResetCode(auth, code) { assert.equal(code, 'valid'); return 'teste@example.com' },
    async confirmPasswordReset(auth, code, password) {
      assert.equal(code, 'valid'); assert.equal(password, ' nova senha ')
      await new Promise(resolve => { finish = resolve })
    },
  } })
  assert.equal(await service.verificarRedefinicao('valid'), 'teste@example.com')
  const pending = service.redefinirSenha('valid', ' nova senha ').then(() => { completed = true })
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(completed, false)
  finish(); await pending
  assert.equal(completed, true)
})

test('link expirado ou usado propaga erro sem sinalizar sucesso', async () => {
  for (const code of ['auth/expired-action-code', 'auth/invalid-action-code']) {
    const error = { code }
    const service = createAuthService({ auth: {}, ready: Promise.resolve({error:null}), sdk: {
      async verifyPasswordResetCode() { throw error },
      async confirmPasswordReset() { throw error },
    } })
    await assert.rejects(service.verificarRedefinicao('bad'), e => e === error)
    await assert.rejects(service.redefinirSenha('bad', '123456'), e => e === error)
    assert.match(authErrorMessage(error), /Solicite um novo/)
  }
})

test('cadastro espera persistência, limpa email e preserva senha', async () => {
  let resolveReady
  let called = false
  const auth = {}
  const user = { uid: 'test' }
  const ready = new Promise(resolve => { resolveReady = resolve })
  const service = createAuthService({ auth, ready, sdk: {
    async signOut(instance) { assert.equal(instance, auth) },
    async createUserWithEmailAndPassword(instance, email, senha) {
      called = true
      assert.equal(instance, auth)
      assert.equal(email, 'teste@example.com')
      assert.equal(senha, ' senha com espaços ')
      return { user }
    },
  } })
  const pending = service.cadastrar(' teste@example.com ', ' senha com espaços ')
  assert.equal(called, false)
  resolveReady({ error: null })
  assert.equal(await pending, user)
})

test('login propaga erro do Firebase para tratamento pela tela', async () => {
  const error = { code: 'auth/invalid-credential' }
  const service = createAuthService({ auth: {}, ready: Promise.resolve({error:null}), sdk: {
    async signInWithEmailAndPassword() { throw error },
  } })
  await assert.rejects(service.entrar('a@b.com', '123456'), e => e === error)
  assert.equal(authErrorMessage(error), authErrorMessage({code:'auth/user-not-found'}))
})

test('falha de persistência impede cadastro; logout continua disponível', async () => {
  const error = new Error('storage unavailable')
  let signedOut = false
  const service = createAuthService({auth:{}, ready:Promise.resolve({error}), sdk:{
    async signOut() { signedOut = true },
    async createUserWithEmailAndPassword() { assert.fail('Não deveria criar conta') },
  }})
  await assert.rejects(service.cadastrar('a@b.com', '123456'), error)
  await service.sair()
  assert.equal(signedOut, true)
})

test('observador retorna função de limpeza do SDK', () => {
  const cleanup = () => {}
  const callback = () => {}
  const service = createAuthService({auth:{}, ready:Promise.resolve({error:null}), sdk:{
    onAuthStateChanged(auth, received) { assert.equal(received, callback); return cleanup },
  }})
  assert.equal(service.observar(callback), cleanup)
})

test('cadastro salva nome e termina sessão antes de retornar sucesso', async () => {
  const calls = []
  const user = { uid: 'new-user' }
  const service = createAuthService({ auth: {}, ready: Promise.resolve({ error: null }), sdk: {
    async createUserWithEmailAndPassword() { calls.push('create'); return { user } },
    async updateProfile(received, profile) { assert.equal(received, user); assert.equal(profile.displayName, 'Luciano'); calls.push('profile') },
    async signOut() { calls.push('logout') },
  } })
  assert.equal(await service.cadastrar('a@b.com', '123456', ' Luciano '), user)
  assert.deepEqual(calls, ['create', 'profile', 'logout'])
})

test('falha ao salvar nome ainda encerra sessão e informa conta já criada', async () => {
  let loggedOut = false
  const service = createAuthService({ auth: {}, ready: Promise.resolve({ error: null }), sdk: {
    async createUserWithEmailAndPassword() { return { user: {} } },
    async updateProfile() { throw new Error('offline') },
    async signOut() { loggedOut = true },
  } })
  await assert.rejects(service.cadastrar('a@b.com', '123456', 'Nome'), { code: 'auth/profile-save-failed' })
  assert.equal(loggedOut, true)
})
