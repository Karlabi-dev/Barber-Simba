import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import AppShell from '../components/AppShell'
import Header from '../components/Header'
import Button from '../components/Button'
import { services } from '../data/services'
import { barbeiros } from '../data/barbeiros'
import { readBooking, saveBooking } from '../data/booking'

export default function Booking() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [draft, setDraft] = useState(() => {
    const saved = readBooking()
    return { servico: params.get('servico') || saved?.servico || services[0].nome,
      profissional: params.get('profissional') || saved?.profissional || barbeiros[0].nome,
      data: saved?.data || '', horario: saved?.horario || '', observacoes: saved?.observacoes || '' }
  })
  const service = services.find(item => item.nome === draft.servico) || services[0]
  const change = event => setDraft({ ...draft, [event.target.name]: event.target.value })
  const today = new Date().toLocaleDateString('en-CA')
  return <AppShell><Header title="Agendamento" compact backTo="/servicos" />
    <p className="subtitle">Escolha os detalhes para reservar seu horário</p>
    <form className="booking-form" onSubmit={event => { event.preventDefault(); saveBooking({...draft, servico: service.nome}); navigate('/confirmar-agendamento') }}>
      <article className="selected-service"><span><img src={service.icon} alt="" /></span><div><strong>{service.nome}</strong><small>{service.duracao} min • Serviço selecionado</small></div><b>R$ {service.preco}</b></article>
      <label>Profissional<select name="profissional" value={draft.profissional} onChange={change} required>{barbeiros.map(item => <option key={item.nome}>{item.nome}</option>)}</select></label>
      <div className="field-row"><label>Data<input name="data" type="date" min={today} value={draft.data} onChange={change} required /></label><label>Horário<input name="horario" type="time" value={draft.horario} onChange={change} required /></label></div>
      <label>Observações (opcional)<textarea name="observacoes" maxLength={500} value={draft.observacoes} onChange={change} placeholder="Ex.: preferência de corte, alergias..." /></label>
      <div className="booking-summary"><span><small>Total</small><strong>{service.nome}</strong></span><b>R$ {service.preco},00</b></div>
      <Button type="submit">CONFIRMAR AGENDAMENTO</Button>
    </form>
  </AppShell>
}
