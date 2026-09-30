import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import AppShell from '../components/AppShell'
import Header from '../components/Header'
import Button from '../components/Button'
import { services } from '../data/services'
import { barbeiros } from '../data/barbeiros'
import { readBooking, saveBooking } from '../data/booking'
import { loadProfessionals, loadServices } from '../services/catalog'
import { loadAvailability } from '../services/availability'

export default function Booking() {
  const useNeon = import.meta.env.VITE_USE_NEON === 'true'
  const [serviceCatalog, setServiceCatalog] = useState(useNeon ? [] : services)
  const [professionals, setProfessionals] = useState(useNeon ? [] : barbeiros)
  const [catalogError, setCatalogError] = useState('')
  const [availability, setAvailability] = useState(null)
  const [retryAvailability, setRetryAvailability] = useState(0)
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [draft, setDraft] = useState(() => {
    const saved = readBooking()
    const isPreviousBooking = saved?.confirmado
    const choosingProfessional = params.has('profissional') && !params.has('servico')
    return { servico: params.get('servico') || (choosingProfessional || isPreviousBooking ? '' : saved?.servico || ''),
      profissional: params.get('profissional') || saved?.profissional || barbeiros[0].nome,
      data: choosingProfessional || isPreviousBooking ? '' : saved?.data || '',
      horario: choosingProfessional || isPreviousBooking ? '' : saved?.horario || '',
      observacoes: isPreviousBooking ? '' : saved?.observacoes || '' }
  })
  useEffect(() => {
    if (!useNeon) return
    const controller = new AbortController()
    Promise.all([loadServices(controller.signal), loadProfessionals(controller.signal)])
      .then(([items, people]) => { setServiceCatalog(items); setProfessionals(people) })
      .catch(cause => { if (cause.name !== 'AbortError') setCatalogError(cause.message) })
    return () => controller.abort()
  }, [useNeon])
  const service = serviceCatalog.find(item => item.nome === draft.servico)
  const person = professionals.find(item => item.nome === draft.profissional) || professionals[0]
  const serviceSlug = service?.slug
  const professionalSlug = person?.slug
  const date = draft.data
  const availabilityKey = useNeon && serviceSlug && professionalSlug && date
    ? JSON.stringify([serviceSlug, professionalSlug, date]) : ''
  useEffect(() => {
    if (!availabilityKey) return
    const controller = new AbortController()
    loadAvailability(serviceSlug, professionalSlug, date, controller.signal)
      .then(horarios => { if (!controller.signal.aborted) setAvailability({ key: availabilityKey, horarios, error: '' }) })
      .catch(cause => {
        if (!controller.signal.aborted) setAvailability({ key: availabilityKey, horarios: [], error: cause.message })
      })
    return () => controller.abort()
  }, [availabilityKey, serviceSlug, professionalSlug, date, retryAvailability])
  const currentAvailability = availability?.key === availabilityKey ? availability : null
  const horarios = currentAvailability?.horarios || []
  const selectedTime = useNeon && !horarios.includes(draft.horario) ? '' : draft.horario
  const change = event => {
    const { name, value } = event.target
    if (name === 'data' || name === 'profissional' || name === 'servico') setAvailability(null)
    setDraft(current => ({ ...current, [name]: value,
      ...((name === 'data' || name === 'profissional' || name === 'servico') ? { horario: '' } : {}) }))
  }
  const retry = () => { setAvailability(null); setRetryAvailability(value => value + 1) }
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Fortaleza', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
  return <AppShell><Header title="Agendamento" compact backTo={params.has('profissional') && !params.has('servico') ? '/profissionais' : '/servicos'} />
    <p className="subtitle">Escolha os detalhes para reservar seu horário</p>
    {catalogError && <p role="alert">{catalogError}</p>}
    {useNeon && (!serviceCatalog.length || !person) && !catalogError && <p role="status">Carregando serviços e profissionais...</p>}
    {serviceCatalog.length > 0 && person && <form className="booking-form" onSubmit={event => { event.preventDefault(); if (!service || (useNeon && (!currentAvailability || !selectedTime))) return; saveBooking({...draft, horario: selectedTime, servico: service.nome, profissional: person.nome, serviceSlug: service.slug, professionalSlug: person.slug}); navigate('/confirmar-agendamento') }}>
      <label>Serviço<select name="servico" value={service?.nome || ''} onChange={change} required>
        <option value="">Escolha um serviço</option>
        {serviceCatalog.map(item => <option key={item.id || item.nome} value={item.nome}>{item.nome}</option>)}
      </select></label>
      {service && <article className="selected-service"><span><img src={service.icon} alt="" /></span><div><strong>{service.nome}</strong><small>{service.duracao} min • Serviço selecionado</small></div><b>R$ {service.preco}</b></article>}
      <label>Profissional<select name="profissional" value={draft.profissional || person.nome} onChange={change} required>{professionals.map(item => <option key={item.id || item.nome}>{item.nome}</option>)}</select></label>
      <div className="field-row"><label>Data<input name="data" type="date" min={today} value={draft.data} onChange={change} required /></label>
        <label>Horário{useNeon
          ? <select name="horario" value={selectedTime} onChange={change} disabled={!currentAvailability || !!currentAvailability.error || !horarios.length} required>
              <option value="">{!draft.data ? 'Escolha uma data' : !currentAvailability ? 'Carregando...' : currentAvailability.error ? 'Consulta indisponível' : horarios.length ? 'Selecione um horário' : 'Sem horários livres'}</option>
              {horarios.map(time => <option key={time} value={time}>{time}</option>)}
            </select>
          : <input name="horario" type="time" value={draft.horario} onChange={change} required />}</label></div>
      {useNeon && currentAvailability?.error && <p className="availability-message" role="alert">{currentAvailability.error} <button type="button" onClick={retry}>Tentar novamente</button></p>}
      {useNeon && currentAvailability && !currentAvailability.error && !horarios.length && <p className="availability-message" role="status">Não há horários livres nessa data. Escolha outra data ou profissional.</p>}
      <label>Observações (opcional)<textarea name="observacoes" maxLength={500} value={draft.observacoes} onChange={change} placeholder="Ex.: preferência de corte, alergias..." /></label>
      <div className="booking-summary"><span><small>Total</small><strong>{service?.nome || 'Escolha um serviço'}</strong></span><b>{service ? `R$ ${service.preco}` : '—'}</b></div>
      <Button type="submit" disabled={!service || (useNeon && (!currentAvailability || !!currentAvailability.error || !selectedTime))}>CONFIRMAR AGENDAMENTO</Button>
    </form>}
  </AppShell>
}
