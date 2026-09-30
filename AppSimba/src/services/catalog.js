import scissors from '../assets/icons/tesoura.png'
import beard from '../assets/icons/barba.png'
import razor from '../assets/icons/narvalha.png'
import sparkle from '../assets/icons/brilho.png'

const icons = { tesoura: scissors, barba: beard, narvalha: razor, brilho: sparkle }

export async function loadServices(signal) {
  const response = await fetch('/api/services', { signal })
  if (!response.ok) throw new Error('Não foi possível carregar os serviços.')
  const rows = await response.json()
  if (!Array.isArray(rows)) throw new Error('Resposta inválida do catálogo.')
  return rows.map(item => ({
    ...item,
    preco: Number(item.preco).toLocaleString('pt-BR', { maximumFractionDigits: 2 }),
    icon: icons[item.iconKey] || scissors,
  }))
}
