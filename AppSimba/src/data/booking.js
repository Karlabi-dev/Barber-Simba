import { addNotification, bookingDescription, removeBookingReminder } from './notifications.js'
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
  if (!existing) addNotification({bookingId:booking.id, type:'created', title:'Agendamento confirmado', message:bookingDescription(booking)})
  return booking
}
export function updateBookingStatus(id, status, actor = 'usuario') {
  const current = readBookingHistory()
  const previous = current.find(item => item.id === id)
  if (!previous || previous.status === status) return current
  const history = current.map(item => item.id === id ? {...item, status} : item)
  sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history))
  if (status === 'cancelado') {
    removeBookingReminder(id)
    addNotification({bookingId:id, type:'cancelled', title:actor === 'barbeiro' ? 'Cancelado pelo profissional' : 'Agendamento cancelado', message:actor === 'barbeiro' ? `${previous.profissional} cancelou seu agendamento. ${bookingDescription(previous)}` : `Você cancelou: ${bookingDescription(previous)}`})
  }
  return history
}
export function changeBooking(id, changes, actor = 'barbeiro') {
  const history = readBookingHistory()
  const previous = history.find(item => item.id === id)
  if (!previous || previous.status !== 'confirmado') throw new Error('Agendamento não disponível para alteração.')
  const allowed = Object.fromEntries(Object.entries(changes).filter(([key]) => ['data','horario','profissional','servico','observacoes'].includes(key)))
  const updated = {...previous, ...allowed}
  if (Object.keys(allowed).every(key => previous[key] === updated[key])) return previous
  sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history.map(item => item.id === id ? updated : item)))
  removeBookingReminder(id)
  const timeChanged = previous.data !== updated.data || previous.horario !== updated.horario
  addNotification({bookingId:id, type:'changed', title:timeChanged ? 'Alteração de horário' : 'Alteração no agendamento', message:`${actor === 'barbeiro' ? 'O profissional alterou seu agendamento.' : 'Você alterou seu agendamento.'} Antes: ${bookingDescription(previous)} Agora: ${bookingDescription(updated)}`})
  return updated
}
