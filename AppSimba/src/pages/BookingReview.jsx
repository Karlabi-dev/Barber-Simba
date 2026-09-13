import { useNavigate } from 'react-router-dom'
import AppShell from '../components/AppShell'
import Header from '../components/Header'
import Button from '../components/Button'
import hero from '../assets/hero.png'
import calendar from '../assets/icons/calendario.png'
import location from '../assets/icons/localizador.png'
import bell from '../assets/icons/sino.png'

export default function BookingReview() {
  const navigate = useNavigate()
  return <AppShell nav={false}><Header title="Confirmar agendamento" compact backTo="/agendamento" />
    <section className="success-heading"><span className="check-circle">✓</span><h2>Quase tudo pronto!</h2><p>Revise os detalhes do seu agendamento abaixo antes de confirmar sua consulta.</p></section>
    <article className="review-card"><div className="review-label"><strong>Profissional Especializado</strong><em>Corte presencial</em></div>
      <div className="review-person"><img src={hero} alt="Thiago Silva" /><span><strong>Thiago Silva</strong><small>Corte Masculino & Barba</small></span></div>
      <div className="review-row"><img src={calendar} alt="" /><span><small>Data e Horário</small><strong>Terça-feira, 20 de Outubro</strong><p>Às 14:30 • Horário de Brasília</p></span></div>
      <div className="review-row"><img src={location} alt="" /><span><small>Localização</small><strong>Barbearia - Simba</strong><p>Av. Presidente Castelo Branco, 1408 • Fortaleza, Ceará - CE</p><div className="map-preview">⌖</div></span></div>
    </article>
    <div className="reminder"><img src={bell} alt="" /><p>Lembrete: Enviaremos notificações de confirmação e instruções por WhatsApp e e-mail.</p></div>
    <div className="review-actions"><Button onClick={() => navigate('/agendamento-confirmado')}>Confirmar Agendamento</Button><Button variant="secondary" onClick={() => navigate('/agendamento')}>Editar Agendamento</Button></div>
  </AppShell>
}
