import { useEffect, useState } from 'react'
import AdminPage from '../components/AdminPage'
import AdminBookingCard from '../components/AdminBookingCard'
import { useAuth } from '../hooks/useAuth'
import { loadAdminAgenda, loadAdminProfessionals, loadAdminServices } from '../services/admin'
import { agendaRange, shiftAgendaDate, todayInFortaleza } from '../services/adminDates'
import './AdminAgenda.css'

const views = [['day', 'Dia'], ['week', 'Semana'], ['month', 'Mês']]
const fullDate = value => new Date(`${value}T12:00:00Z`).toLocaleDateString('pt-BR', {
  timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric',
})

export default function AdminAgenda() {
  const { usuario } = useAuth()
  const [anchor, setAnchor] = useState(todayInFortaleza)
  const [view, setView] = useState('day')
  const [professionalId, setProfessionalId] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [professionals, setProfessionals] = useState([])
  const [services, setServices] = useState([])
  const [filtersError, setFiltersError] = useState('')
  const [retry, setRetry] = useState(0)
  const { start, end } = agendaRange(anchor, view)
  const key = `${start}:${end}:${professionalId}:${serviceId}:${retry}`
  const [list, setList] = useState({ key: '', rows: [], loading: true, more: false, error: '' })
  const [loadingMore, setLoadingMore] = useState(false)
  const current = list.key === key ? list : { key, rows: [], loading: true, more: false, error: '' }

  useEffect(() => {
    const controller = new AbortController()
    Promise.all([loadAdminProfessionals(usuario, controller.signal), loadAdminServices(usuario, controller.signal)])
      .then(([people, catalog]) => {
        if (!Array.isArray(people) || !Array.isArray(catalog)) throw new Error('Resposta inválida dos filtros.')
        setProfessionals(people)
        setServices(catalog)
        setFiltersError('')
      })
      .catch(cause => { if (!controller.signal.aborted) setFiltersError(cause.message) })
    return () => controller.abort()
  }, [usuario, retry])

  useEffect(() => {
    const controller = new AbortController()
    const params = { start, end, professionalId, serviceId }
    loadAdminAgenda(usuario, params, controller.signal)
      .then(rows => {
        if (!Array.isArray(rows)) throw new Error('Resposta inválida da agenda.')
        setList({ key, rows, loading: false, more: rows.length === 100, error: '' })
      })
      .catch(cause => { if (!controller.signal.aborted) setList({ key, rows: [], loading: false, more: false, error: cause.message }) })
    return () => controller.abort()
  }, [usuario, key, start, end, professionalId, serviceId])

  async function loadMore() {
    if (current.loading || !current.more || loadingMore) return
    setLoadingMore(true)
    try {
      const rows = await loadAdminAgenda(usuario, { start, end, professionalId, serviceId, offset: current.rows.length })
      if (!Array.isArray(rows)) throw new Error('Resposta inválida da agenda.')
      setList(previous => previous.key === key ? { ...previous, rows: [...previous.rows, ...rows], more: rows.length === 100, error: '' } : previous)
    } catch (cause) {
      setList(previous => previous.key === key ? { ...previous, error: cause.message } : previous)
    } finally { setLoadingMore(false) }
  }

  return <AdminPage title="AGENDA DA BARBEARIA">
    <p className="admin-intro">Atendimentos registrados no banco de dados</p>
    <div className="admin-agenda-period">
      <button type="button" onClick={() => setAnchor(value => shiftAgendaDate(value, view, -1))} aria-label="Período anterior">‹</button>
      <label>Data de referência<input type="date" value={anchor} onChange={event => { if (event.target.value) setAnchor(event.target.value) }} /></label>
      <button type="button" onClick={() => setAnchor(value => shiftAgendaDate(value, view, 1))} aria-label="Próximo período">›</button>
    </div>
    <div className="admin-agenda-views" role="group" aria-label="Visualização da agenda">
      {views.map(([value, label]) => <button type="button" key={value} aria-pressed={view === value} onClick={() => setView(value)}>{label}</button>)}
    </div>
    <p className="admin-agenda-range">{view === 'day' ? fullDate(start) : `De ${fullDate(start)} até ${fullDate(shiftAgendaDate(end, 'day', -1))}`}</p>
    <div className="admin-agenda-filters">
      <label>Profissional<select value={professionalId} onChange={event => setProfessionalId(event.target.value)}><option value="">Todos os profissionais</option>{professionals.map(item => <option key={item.id} value={item.id}>{item.nome}</option>)}</select></label>
      <label>Serviço<select value={serviceId} onChange={event => setServiceId(event.target.value)}><option value="">Todos os serviços</option>{services.map(item => <option key={item.id} value={item.id}>{item.nome}</option>)}</select></label>
    </div>
    {filtersError && <p className="admin-error" role="alert">Filtros: {filtersError}</p>}
    {current.error && <p className="admin-error" role="alert">{current.error} <button type="button" onClick={() => setRetry(value => value + 1)}>Tentar novamente</button></p>}
    {current.loading && <p className="admin-feedback" role="status">Carregando agenda...</p>}
    {!current.loading && !current.error && !current.rows.length && <p className="admin-feedback">Nenhum atendimento neste período.</p>}
    <div className="admin-list">{current.rows.map(booking => <AdminBookingCard key={booking.id} booking={booking} />)}</div>
    {current.more && <button type="button" className="admin-more" onClick={loadMore} disabled={loadingMore}>{loadingMore ? 'Carregando...' : 'Carregar mais'}</button>}
  </AdminPage>
}
