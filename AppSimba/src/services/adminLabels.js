export const adminStatusName = {
  confirmado: 'Agendado', em_atendimento: 'Em atendimento',
  concluido: 'Finalizado', cancelado: 'Cancelado',
}

export function adminDateLabel(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return value || ''
  return new Date(`${value}T12:00:00Z`).toLocaleDateString('pt-BR', {
    timeZone: 'UTC', day: '2-digit', month: 'short',
  })
}
