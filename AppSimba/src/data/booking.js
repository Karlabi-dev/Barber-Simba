export function readBooking() {
  try { return JSON.parse(sessionStorage.getItem('simba-booking') || 'null') } catch { return null }
}
export function saveBooking(value) { sessionStorage.setItem('simba-booking', JSON.stringify(value)) }

const HISTORY_KEY = 'simba-booking-history'
export function readBookingHistory() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(HISTORY_KEY) || '[]')
    if (Array.isArray(saved) && saved.length) return saved
    const previous = readBooking()
    return previous?.confirmado && previous.data && previous.horario
      ? [{...previous, id: previous.id || 'previous-booking', status: 'confirmado'}] : []
  } catch { return [] }
}
export function confirmBooking(draft) {
  const history = readBookingHistory()
  const existing = history.find(item => item.status === 'confirmado' && item.data === draft.data && item.horario === draft.horario && item.profissional === draft.profissional && item.servico === draft.servico)
  const booking = {...draft, id:existing?.id || crypto.randomUUID(), status:'confirmado', confirmado:true}
  sessionStorage.setItem(HISTORY_KEY, JSON.stringify(existing ? history : [booking, ...history]))
  saveBooking(booking)
  return booking
}
export function updateBookingStatus(id, status) {
  const history = readBookingHistory().map(item => item.id === id ? {...item, status} : item)
  sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history))
  return history
}
