import test from 'node:test'
import assert from 'node:assert/strict'
import { agendaRange, shiftAgendaDate, todayInFortaleza } from '../src/services/adminDates.js'

test('agenda respeita o dia de Fortaleza e atravessa mês e ano sem usar o fuso do PC', () => {
  assert.equal(todayInFortaleza(new Date('2026-10-01T01:00:00Z')), '2026-09-30')
  assert.deepEqual(agendaRange('2026-09-30', 'day'), { start: '2026-09-30', end: '2026-10-01' })
  assert.deepEqual(agendaRange('2026-09-30', 'week'), { start: '2026-09-28', end: '2026-10-05' })
  assert.deepEqual(agendaRange('2026-12-31', 'month'), { start: '2026-12-01', end: '2027-01-01' })
  assert.equal(shiftAgendaDate('2026-01-31', 'month', 1), '2026-02-01')
})
