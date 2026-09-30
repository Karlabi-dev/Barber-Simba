const formatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Fortaleza', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
})

export const scheduleDays = `(SELECT string_agg(CASE h.weekday
  WHEN 1 THEN 'Seg' WHEN 2 THEN 'Ter' WHEN 3 THEN 'Qua' WHEN 4 THEN 'Qui'
  WHEN 5 THEN 'Sex' WHEN 6 THEN 'Sáb' WHEN 7 THEN 'Dom' END, '/' ORDER BY h.weekday)
  FROM professional_hours h WHERE h.professional_id = professionals.id)`

export function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T12:00:00Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

export function validTime(value) {
  return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
}

export function minutes(value) {
  const [hour, minute] = value.slice(0, 5).split(':').map(Number)
  return hour * 60 + minute
}

export function futureLocal(date, time, now = new Date()) {
  const parts = Object.fromEntries(formatter.formatToParts(now).map(part => [part.type, part.value]))
  const today = `${parts.year}-${parts.month}-${parts.day}`
  const current = `${parts.hour}:${parts.minute}`
  return date > today || (date === today && time > current)
}

export function availableTimes({ date, duration, opensAt, closesAt, occupied, now = new Date() }) {
  const start = Math.ceil(minutes(opensAt) / 30) * 30
  const end = minutes(closesAt)
  const result = []
  for (let minute = start; minute + Number(duration) <= end; minute += 30) {
    const time = `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`
    if (futureLocal(date, time, now) && !occupied.some(item => minute < Number(item.fim) && minute + Number(duration) > Number(item.inicio)))
      result.push(time)
  }
  return result
}
