async function requestBooking(path, user, options = {}) {
  if (!user) throw new Error('Entre na sua conta para agendar.')
  const token = await user.getIdToken()
  const response = await fetch(path, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, ...(options.body ? { 'Content-Type': 'application/json' } : {}) },
  })
  const result = await response.json()
  if (!response.ok) throw new Error(result.error || 'Não foi possível consultar o agendamento.')
  return result
}

export const listBookings = user => requestBooking('/api/bookings', user)
export const createBooking = (user, draft) => requestBooking('/api/bookings', user, {
  method: 'POST', body: JSON.stringify({
    serviceSlug: draft.serviceSlug, professionalSlug: draft.professionalSlug,
    data: draft.data, horario: draft.horario, observacoes: draft.observacoes || '',
  }),
})
export const cancelBooking = (user, id) => requestBooking(`/api/bookings/${encodeURIComponent(id)}/cancel`, user, { method: 'PATCH' })
