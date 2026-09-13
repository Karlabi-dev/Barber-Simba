import { useNavigate } from 'react-router-dom'
import AppShell from '../components/AppShell'
import Header from '../components/Header'
import Button from '../components/Button'
import scissors from '../assets/icons/tesoura.png'

export default function Booking() {
  const navigate = useNavigate()
  return <AppShell><Header title="AGENDAMENTO" compact backTo="/servicos" />
    <p className="subtitle">Escolha os detalhes para reservar seu horário</p>
    <form className="booking-form" onSubmit={(event) => { event.preventDefault(); navigate('/confirmar-agendamento') }}>
      <article className="selected-service"><span><img src={scissors} alt="" /></span><div><strong>Corte Premium</strong><small>45 min • Serviço selecionado</small></div><b>R$ 45</b></article>
      <label>Profissional<select defaultValue="Thiago Silva"><option>Thiago Silva</option><option>Marcus Rossi</option><option>Felipe Souza</option></select></label>
      <div className="field-row"><label>Data<input type="date" defaultValue="2026-10-20" /></label><label>Horário<input type="time" defaultValue="14:30" /></label></div>
      <label>Observações (opcional)<textarea placeholder="Ex.: preferência de corte, alergias..." /></label>
      <div className="booking-summary"><span><small>Total</small><strong>Corte Premium</strong></span><b>R$ 45,00</b></div>
      <Button type="submit">CONFIRMAR AGENDAMENTO</Button>
    </form>
  </AppShell>
}
