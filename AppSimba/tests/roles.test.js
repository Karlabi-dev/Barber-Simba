import test from 'node:test'
import assert from 'node:assert/strict'
import { homeForRole, roleFromClaims } from '../src/services/roles.js'

test('a claim booleana define a área após o login, com prioridade para administrador', () => {
  assert.equal(roleFromClaims({ admin: true, professional: true }), 'admin')
  assert.equal(roleFromClaims({ admin: 'true', professional: false }), 'cliente')
  assert.equal(roleFromClaims({ professional: true }), 'profissional')
  assert.equal(homeForRole(roleFromClaims({ admin: true })), '/admin')
  assert.equal(homeForRole(roleFromClaims({ professional: true })), '/profissional')
  assert.equal(homeForRole(roleFromClaims({})), '/home')
})
