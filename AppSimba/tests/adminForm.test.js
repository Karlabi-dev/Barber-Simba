import test from 'node:test'
import assert from 'node:assert/strict'
import { decimalPrice, slugFromName } from '../src/services/adminForm.js'

test('cadastro usa identificador aceito pela API e preço decimal sem perder centavos', () => {
  assert.equal(slugFromName('  João & Barba  '), 'joao-barba')
  assert.equal(decimalPrice(' 45,50 '), '45.50')
  assert.equal(decimalPrice('0'), '0.00')
  assert.equal(decimalPrice('45,999'), null)
  assert.equal(decimalPrice('-10'), null)
  assert.equal(decimalPrice('1.000,00'), null)
})
