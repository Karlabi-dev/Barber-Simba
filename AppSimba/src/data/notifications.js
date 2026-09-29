const KEY = 'simba-notifications'
export const NOTIFICATIONS_CHANGED = 'simba-notifications-changed'
export function readNotifications() {
  try { const items = JSON.parse(sessionStorage.getItem(KEY) || '[]'); return Array.isArray(items) ? items : [] } catch { return [] }
}
function save(items) {
  sessionStorage.setItem(KEY, JSON.stringify(items))
  window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED))
}
export function addNotification({id = crypto.randomUUID(), ...notification}) {
  const items = readNotifications()
  if (items.some(item => item.id === id)) return
  save([{...notification, id, createdAt:new Date().toISOString(), read:false}, ...items])
}
export function markNotificationsRead() { save(readNotifications().map(item => ({...item, read:true}))) }
export function removeBookingReminder(bookingId) {
  const items = readNotifications()
  const next = items.filter(item => item.type !== 'reminder' || item.bookingId !== bookingId)
  if (next.length !== items.length) save(next)
}
export function bookingDescription(booking) {
  const date = new Date(`${booking.data}T12:00:00`).toLocaleDateString('pt-BR')
  return `${booking.servico} com ${booking.profissional}, em ${date} às ${booking.horario}.`
}
export function syncReminders(bookings, now = new Date()) {
  const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1)
  const day = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth()+1).padStart(2,'0')}-${String(tomorrow.getDate()).padStart(2,'0')}`
  bookings.filter(item => item.status === 'confirmado' && item.data === day).forEach(item => addNotification({
    id:`reminder:${item.id}:${item.data}:${item.horario}`, bookingId:item.id, type:'reminder',
    title:'Seu agendamento é amanhã', message:`Amanhã, às ${item.horario}, você tem ${item.servico} com ${item.profissional}.`, profissional:item.profissional
  }))
}
