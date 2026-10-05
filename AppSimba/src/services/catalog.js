import logo from '../assets/logo.png'
import profile from '../assets/icons/perfil.png'
import allander from '../assets/allander.png'

export async function loadServices(signal) {
  const response = await fetch('/api/services', { signal })
  if (!response.ok) throw new Error('Não foi possível carregar os serviços.')
  const rows = await response.json()
  if (!Array.isArray(rows)) throw new Error('Resposta inválida do catálogo.')
  return rows.map(item => ({
    ...item,
    preco: Number(item.preco).toLocaleString('pt-BR', { maximumFractionDigits: 2 }),
    icon: logo,
  }))
}

export async function loadProfessionals(signal) {
  const response = await fetch('/api/professionals', { signal })
  if (!response.ok) throw new Error('Não foi possível carregar os profissionais.')
  const rows = await response.json()
  if (!Array.isArray(rows)) throw new Error('Resposta inválida dos profissionais.')
  return rows.map(item => ({
    ...item,
    foto: item.imageKey === 'allander' ? allander : profile,
    avaliacao: Number(item.avaliacao).toFixed(1),
  }))
}
