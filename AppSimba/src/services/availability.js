export async function loadAvailability(serviceSlug, professionalSlug, data, signal) {
  const query = new URLSearchParams({ serviceSlug, professionalSlug, data })
  const response = await fetch(`/api/availability?${query}`, { signal })
  if (!response.ok) throw new Error('Não foi possível consultar os horários. Tente novamente.')
  const result = await response.json()
  if (result.data !== data || !Array.isArray(result.horarios) ||
      !result.horarios.every(time => typeof time === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(time))) {
    throw new Error('Resposta inválida ao consultar os horários.')
  }
  return result.horarios
}
