import test from 'node:test'
import assert from 'node:assert/strict'
import { createAuthService } from '../src/services/createAuthService.js'
import { authErrorMessage } from '../src/services/authErrors.js'

test('cadastro espera persistência, limpa email e preserva senha', async () => {
  let resolveReady
  let called = false
  const auth = {}
  const user = { uid: 'test' }
  const ready = new Promise(resolve => { resolveReady = resolve })
  const service = createAuthService({ auth, ready, sdk: {
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
