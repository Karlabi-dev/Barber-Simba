async function requestNotifications(user, options) {
  const token = await user.getIdToken()
  const response = await fetch(options ? '/api/notifications/read' : '/api/notifications', {
    ...options, headers: { Authorization: `Bearer ${token}` },
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || 'Não foi possível consultar as notificações.')
  return data
}

export const listNotifications = user => requestNotifications(user)
export const markAllNotificationsRead = user => requestNotifications(user, { method: 'PATCH' })
