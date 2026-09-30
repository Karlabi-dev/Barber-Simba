import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import AppShell from '../components/AppShell'
import Header from '../components/Header'
import Button from '../components/Button'
import { services } from '../data/services'
import { barbeiros } from '../data/barbeiros'
import { readBooking, saveBooking } from '../data/booking'
import { loadProfessionals, loadServices } from '../services/catalog'

export default function Booking() {
  const useNeon = import.meta.env.VITE_USE_NEON === 'true'
  const [serviceCatalog, setServiceCatalog] = useState(useNeon ? [] : services)
  const [professionals, setProfessionals] = useState(useNeon ? [] : barbeiros)
  const [catalogError, setCatalogError] = useState('')
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [draft, setDraft] = useState(() => {
    const saved = readBooking()
    return { servico: params.get('servico') || saved?.servico || services[0].nome,
      profissional: params.get('profissional') || saved?.profissional || barbeiros[0].nome,
      data: saved?.data || '', horario: saved?.horario || '', observacoes: saved?.observacoes || '' }
  })
  useEffect(() => {
    if (!useNeon) return
    const controller = new AbortController()
    Promise.all([loadServices(controller.signal), loadProfessionals(controller.signal)])
      .then(([items, people]) => { setServiceCatalog(items); setProfessionals(people) })
      .catch(cause => { if (cause.name !== 'AbortError') setCatalogError(cause.message) })
    return () => controller.abort()
  }, [useNeon])
  const service = serviceCatalog.find(item => item.nome === draft.servico) || serviceCatalog[0]
  const person = professionals.find(item => item.nome === draft.profissional) || professionals[0]
  const change = event => setDraft({ ...draft, [event.target.name]: event.target.value })
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Fortaleza', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
  return <AppShell><Header title="Agendamento" compact backTo="/servicos" />
    <p className="subtitle">Escolha os detalhes para reservar seu horário</p>
    {catalogError && <p role="alert">{catalogError}</p>}
    {useNeon && (!service || !person) && !catalogError && <p role="status">Carregando serviços e profissionais...</p>}
    {service && person && <form className="booking-form" onSubmit={event => { event.preventDefault(); saveBooking({...draft, servico: service.nome, profissional: person.nome, serviceSlug: service.slug, professionalSlug: person.slug}); navigate('/confirmar-agendamento') }}>
      <article className="selected-service"><span><img src={service.icon} alt="" /></span><div><strong>{service.nome}</strong><small>{service.duracao} min • Serviço selecionado</small></div><b>R$ {service.preco}</b></article>
      <label>Profissional<select name="profissional" value={draft.profissional || person.nome} onChange={change} required>{professionals.map(item => <option key={item.id || item.nome}>{item.nome}</option>)}</select></label>
      <div className="field-row"><label>Data<input name="data" type="date" min={today} value={draft.data} onChange={change} required /></label><label>Horário<input name="horario" type="time" value={draft.horario} onChange={change} required /></label></div>
      <label>Observações (opcional)<textarea name="observacoes" maxLength={500} value={draft.observacoes} onChange={change} placeholder="Ex.: preferência de corte, alergias..." /></label>
      <div className="booking-summary"><span><small>Total</small><strong>{service.nome}</strong></span><b>R$ {service.preco}</b></div>
      <Button type="submit">CONFIRMAR AGENDAMENTO</Button>
    </form>}
  </AppShell>
}
