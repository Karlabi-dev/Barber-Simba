import { Navigate, useNavigate } from 'react-router-dom'
import AppShell from '../components/AppShell'
import Header from '../components/Header'
import Button from '../components/Button'
import { readBooking, saveBooking } from '../data/booking'
import { barbeiros } from '../data/barbeiros'
import calendar from '../assets/icons/calendario.png'
import location from '../assets/icons/localizador.png'
import bell from '../assets/icons/sino.png'

export default function BookingReview() {
  const navigate = useNavigate()
  const draft = readBooking()
  if (!draft?.data || !draft?.horario) return <Navigate to="/agendamento" replace />
  const barber = barbeiros.find(item => item.nome === draft.profissional) || barbeiros[0]
  const date = new Date(draft.data + 'T12:00:00').toLocaleDateString('pt-BR', {weekday:'long', day:'numeric', month:'long'})
  return <AppShell nav={false}><Header title="Confirmar agendamento" compact backTo="/agendamento" />
    <section className="success-heading"><span className="check-circle">✓</span><h2>Quase tudo pronto!</h2><p>Revise os detalhes do seu agendamento abaixo antes de confirmar.</p></section>
    <article className="review-card"><div className="review-label"><strong>Profissional Especializado</strong><em>{draft.servico}</em></div>
      <div className="review-person"><img src={barber.foto} alt="" /><span><strong>{barber.nome}</strong><small>{draft.servico}</small></span></div>
      <div className="review-row"><img src={calendar} alt="" /><span><small>Data e Horário</small><strong>{date}</strong><p>Às {draft.horario} • Horário de Brasília</p></span></div>
      <div className="review-row"><img src={location} alt="" /><span><small>Localização</small><strong>Barbearia - Simba</strong><p>Av. Presidente Castelo Branco, 1408 • Cj 42 • Fortaleza, Ceará - CE</p><a href="https://www.google.com/maps/search/?api=1&query=Av.+Presidente+Castelo+Branco+1408+Fortaleza" target="_blank" rel="noreferrer">Ver endereço no mapa</a></span></div>
      {draft.observacoes && <p>Observações: {draft.observacoes}</p>}
    </article>
    <div className="reminder"><img src={bell} alt="" /><p>Demonstração local: notificações por WhatsApp e e-mail ainda não estão integradas.</p></div>
    <div className="review-actions"><Button onClick={() => {saveBooking({...draft, confirmado:true}); navigate('/agendamento-confirmado')}}>Confirmar Agendamento</Button><Button variant="secondary" onClick={() => navigate('/agendamento')}>Editar Agendamento</Button></div>
  </AppShell>
}
