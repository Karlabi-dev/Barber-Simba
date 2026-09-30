const fortalezaDateTime = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Fortaleza', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
})

function localDateTime(now) {
  const parts = Object.fromEntries(fortalezaDateTime.formatToParts(now).map(part => [part.type, part.value]))
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`
}

export function nextBooking(bookings, now = new Date()) {
  const current = localDateTime(now)
  return bookings
    .filter(item => item.status === 'confirmado' &&
      /^\d{4}-\d{2}-\d{2}$/.test(item.data) && /^([01]\d|2[0-3]):[0-5]\d$/.test(item.horario) &&
      `${item.data}T${item.horario}` > current)
    .sort((a, b) => `${a.data}T${a.horario}`.localeCompare(`${b.data}T${b.horario}`))[0] || null
}

export function bookingDateLabel(date, now = new Date()) {
  const today = localDateTime(now).slice(0, 10)
  const tomorrow = new Date(Date.parse(`${today}T12:00:00Z`) + 86400000).toISOString().slice(0, 10)
  const shortDate = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC', day: 'numeric', month: 'short' })
    .format(new Date(`${date}T12:00:00Z`)).replace(' de ', ' ').replace('.', '')
  return `${date === today ? 'Hoje, ' : date === tomorrow ? 'Amanhã, ' : ''}${shortDate}`
}
