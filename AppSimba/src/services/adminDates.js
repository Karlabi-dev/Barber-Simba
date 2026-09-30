const fortaleza = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Fortaleza', year: 'numeric', month: '2-digit', day: '2-digit' })

export function todayInFortaleza(now = new Date()) {
  const parts = Object.fromEntries(fortaleza.formatToParts(now).map(part => [part.type, part.value]))
  return `${parts.year}-${parts.month}-${parts.day}`
}

const iso = date => date.toISOString().slice(0, 10)
const utcDate = value => new Date(`${value}T12:00:00Z`)

export function agendaRange(anchor, view) {
  const date = utcDate(anchor)
  if (view === 'week') date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 6) % 7)
  if (view === 'month') date.setUTCDate(1)
  const start = iso(date)
  if (view === 'month') date.setUTCMonth(date.getUTCMonth() + 1)
  else date.setUTCDate(date.getUTCDate() + (view === 'week' ? 7 : 1))
  return { start, end: iso(date) }
}

export function shiftAgendaDate(anchor, view, direction) {
  const date = utcDate(anchor)
  if (view === 'month') {
    date.setUTCDate(1)
    date.setUTCMonth(date.getUTCMonth() + direction)
  } else date.setUTCDate(date.getUTCDate() + direction * (view === 'week' ? 7 : 1))
  return iso(date)
}
