export function readBooking() {
  try { return JSON.parse(sessionStorage.getItem('simba-booking') || 'null') } catch { return null }
}
export function saveBooking(value) { sessionStorage.setItem('simba-booking', JSON.stringify(value)) }
