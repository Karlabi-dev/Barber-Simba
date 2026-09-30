async function adminRequest(user, path, signal) {
  const token = await user.getIdToken()
  const response = await fetch(`/api/admin${path}`, {
    signal,
    headers: { Authorization: `Bearer ${token}` },
  })
  const body = await response.json()
  if (!response.ok) throw new Error(body.error || 'Não foi possível consultar o painel.')
  return body
}

export const loadAdminDashboard = (user, signal) => adminRequest(user, '/dashboard', signal)

export function loadAdminBookings(user, filter, offset = 0, signal) {
  const params = new URLSearchParams({ offset: String(offset) })
  if (filter === 'today') params.set('period', 'today')
  if (filter === 'upcoming') {
    params.set('period', 'upcoming')
    params.set('status', 'confirmado')
  }
  return adminRequest(user, `/bookings?${params}`, signal)
}
