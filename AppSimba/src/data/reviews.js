import { readBookingHistory } from './booking.js'
export function readReviews() {
  try { const value = JSON.parse(sessionStorage.getItem('simba-reviews') || '{}'); return value && typeof value === 'object' && !Array.isArray(value) ? value : {} } catch { return {} }
}
export function saveReview(bookingId, stars) {
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) throw new Error('Escolha de 1 a 5 estrelas.')
  if (!readBookingHistory().some(item => item.id === bookingId && item.status === 'concluido')) throw new Error('Somente atendimentos concluídos podem ser avaliados.')
  const reviews = readReviews()
  if (reviews[bookingId]) throw new Error('Este atendimento já foi avaliado.')
  const next = {...reviews, [bookingId]: {stars, createdAt:new Date().toISOString()}}
  sessionStorage.setItem('simba-reviews', JSON.stringify(next))
  return next
}
export function filterProfessionals(items, {search = '', service = '', day = '', rating = ''}) {
  const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  return items.filter(item => normalize(item.nome).includes(normalize(search.trim())) && (!service || item.especialidade === service) && (!day || item.dias.split('/').includes(day)) && (!rating || Number(item.avaliacao) >= Number(rating)))
}
