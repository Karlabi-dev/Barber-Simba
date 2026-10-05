import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import AppShell from '../components/AppShell'
import Header from '../components/Header'
import Button from '../components/Button'
import { readBooking, saveBooking, confirmBooking } from '../data/booking'
import { createBooking } from '../services/bookings'
import { loadProfessionals } from '../services/catalog'
import { useAuth } from '../hooks/useAuth'
import { barbeiros } from '../data/barbeiros'
import profile from '../assets/icons/perfil.png'
import calendar from '../assets/icons/calendario.png'
import location from '../assets/icons/localizador.png'
import bell from '../assets/icons/sino.png'

export default function BookingReview() {
  const useNeon = import.meta.env.VITE_USE_NEON === 'true'
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [professionals, setProfessionals] = useState(useNeon ? [] : barbeiros)
  const draft = readBooking()
  useEffect(() => {
    if (!useNeon) return
    const controller = new AbortController()
    loadProfessionals(controller.signal)
      .then(items => setProfessionals(items))
      .catch(cause => { if (cause.name !== 'AbortError') setError(cause.message) })
    return () => controller.abort()
  }, [useNeon])
  if (!draft?.data || !draft?.horario) return <Navigate to="/agendamento" replace />
  const barber = professionals.find(item => draft.professionalSlug ? item.slug === draft.professionalSlug : item.nome === draft.profissional)
  const date = new Date(draft.data + 'T12:00:00').toLocaleDateString('pt-BR', {weekday:'long', day:'numeric', month:'long'})
  async function confirm() {
    if (saving) return
    setSaving(true)
    setError('')
    try {
      if (useNeon) {
        const created = await createBooking(usuario, draft)
        saveBooking({ ...draft, ...created, confirmado: true })
      } else confirmBooking(draft)
      navigate('/agendamento-confirmado')
    } catch (cause) { setError(cause.message); setSaving(false) }
  }
  return <AppShell nav={false}><Header title="Confirmar agendamento" compact backTo="/agendamento" />
    <section className="success-heading"><span className="check-circle">✓</span><h2>Quase tudo pronto!</h2><p>Revise os detalhes do seu agendamento abaixo antes de confirmar.</p></section>
    <article className="review-card"><div className="review-label"><strong>Profissional Especializado</strong><em>{draft.servico}</em></div>
      <div className="review-person"><img src={barber?.foto || profile} alt="" /><span><strong>{draft.profissional}</strong><small>{draft.servico}</small></span></div>
      <div className="review-row"><img src={calendar} alt="" /><span><small>Data e Horário</small><strong>{date}</strong><p>Às {draft.horario} • Horário de Brasília</p></span></div>
      <div className="review-row"><img src={location} alt="" /><span><small>Localização</small><strong>Barbearia - Simba</strong><p>Av. Presidente Castelo Branco, 1408 • Cj 42 • Fortaleza, Ceará - CE</p><a href="https://www.google.com/maps/search/?api=1&query=Av.+Presidente+Castelo+Branco+1408+Fortaleza" target="_blank" rel="noreferrer">Ver endereço no mapa</a></span></div>
      {draft.observacoes && <p>Observações: {draft.observacoes}</p>}
    </article>
    <div className="reminder"><img src={bell} alt="" /><p>Demonstração local: notificações por WhatsApp e e-mail ainda não estão integradas.</p></div>
    {useNeon && !usuario && <p role="alert">Entre na sua conta antes de confirmar. <a href="/login">Fazer login</a></p>}
    {error && <p role="alert">{error}</p>}
    <div className="review-actions"><Button onClick={confirm} disabled={saving || (useNeon && !usuario)}>{saving ? 'Confirmando...' : 'Confirmar Agendamento'}</Button><Button variant="secondary" onClick={() => navigate('/agendamento')}>Editar Agendamento</Button></div>
  </AppShell>
}
