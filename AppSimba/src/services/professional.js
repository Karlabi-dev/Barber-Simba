async function request(user, path, { method, body, signal } = {}) {
  const token = await user.getIdToken()
  const response = await fetch(`/api/professional${path}`, {
    method, signal,
    headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  const content = await response.text()
  let data
  try { data = content ? JSON.parse(content) : null } catch { /* resposta não JSON do proxy */ }
  if (!response.ok) throw new Error(data?.error || `Não foi possível consultar a agenda (HTTP ${response.status}).`)
  if (data === null || data === undefined) throw new Error('A API não respondeu com dados. Confira se ela está em execução.')
  return data
}

export const loadProfessional = (user, signal) => request(user, '/me', { signal })
export const loadProfessionalDashboard = (user, signal) => request(user, '/dashboard', { signal })
export function loadProfessionalBookings(user, { start, end, status, offset = 0 }, signal) {
  const params = new URLSearchParams({ start, end, offset: String(offset) })
  if (status) params.set('status', status)
  return request(user, `/bookings?${params}`, { signal })
}
export const setProfessionalBookingStatus = (user, id, status) => request(user,
  `/bookings/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: { status } })
export const loadProfessionalHours = (user, signal) => request(user, '/hours', { signal })
export const loadProfessionalServices = (user, signal) => request(user, '/services', { signal })
