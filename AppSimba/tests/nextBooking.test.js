import test from 'node:test'
import assert from 'node:assert/strict'
import { nextBooking, bookingDateLabel } from '../src/services/nextBooking.js'

test('seleciona a reserva futura mais próxima em Fortaleza, ignorando canceladas e horários passados', () => {
  const now = new Date('2026-09-30T18:00:00Z') // 15h em Fortaleza
  const bookings = [
    { id: 'later', status: 'confirmado', data: '2026-10-01', horario: '08:00' },
    { id: 'cancelled', status: 'cancelado', data: '2026-09-30', horario: '15:30' },
    { id: 'past', status: 'confirmado', data: '2026-09-30', horario: '14:30' },
    { id: 'next', status: 'confirmado', data: '2026-09-30', horario: '16:00' },
  ]
  assert.equal(nextBooking(bookings, now)?.id, 'next')
  assert.equal(nextBooking(bookings.filter(item => item.id !== 'next'), now)?.id, 'later')
  assert.equal(nextBooking(bookings.filter(item => item.status !== 'confirmado'), now), null)
  assert.equal(bookingDateLabel('2026-10-01', now).startsWith('Amanhã, '), true)
})

test('usa o horário de Fortaleza quando o navegador estiver em outro fuso', () => {
  const now = new Date('2026-10-01T01:00:00Z') // 30/09 às 22h em Fortaleza
  assert.equal(nextBooking([
    { id: 'near', status: 'confirmado', data: '2026-09-30', horario: '22:30' },
    { id: 'far', status: 'confirmado', data: '2026-10-01', horario: '08:00' },
  ], now)?.id, 'near')
})
