async function adminRequest(user, path, { signal, method, body } = {}) {
  const token = await user.getIdToken()
  const response = await fetch(`/api/admin${path}`, {
    signal, method,
    headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  const result = await response.json()
  if (!response.ok) throw new Error(result.error || 'Não foi possível consultar o painel.')
  return result
}

export const loadAdminDashboard = (user, signal) => adminRequest(user, '/dashboard', { signal })

export function loadAdminBookings(user, filter, offset = 0, signal) {
  const params = new URLSearchParams({ offset: String(offset) })
  if (filter === 'today') params.set('period', 'today')
  if (filter === 'upcoming') {
    params.set('period', 'upcoming')
    params.set('status', 'confirmado')
  }
  return adminRequest(user, `/bookings?${params}`, { signal })
}

export const loadAdminServices = (user, signal) => adminRequest(user, '/services', { signal })
export const saveAdminService = (user, service, id) => adminRequest(user,
  id ? `/services/${encodeURIComponent(id)}` : '/services',
  { method: id ? 'PATCH' : 'POST', body: service })

export const loadAdminProfessionals = (user, signal) => adminRequest(user, '/professionals', { signal })
export const saveAdminProfessional = (user, professional, id) => adminRequest(user,
  id ? `/professionals/${encodeURIComponent(id)}` : '/professionals',
  { method: id ? 'PATCH' : 'POST', body: professional })

export const loadAdminHours = (user, id, signal) => adminRequest(user,
  `/professionals/${encodeURIComponent(id)}/hours`, { signal })
export const saveAdminHours = (user, id, day, hours) => adminRequest(user,
  `/professionals/${encodeURIComponent(id)}/hours/${day}`, { method: 'PUT', body: hours })
export const deleteAdminHours = (user, id, day) => adminRequest(user,
  `/professionals/${encodeURIComponent(id)}/hours/${day}`, { method: 'DELETE' })
