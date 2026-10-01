import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ProfessionalPage from '../components/ProfessionalPage'
import { useAuth } from '../hooks/useAuth'
import { adminDateLabel, adminStatusName } from '../services/adminLabels'
import { agendaRange, shiftAgendaDate, todayInFortaleza } from '../services/adminDates'
import { loadProfessional, loadProfessionalBookings, loadProfessionalDashboard, loadProfessionalHours, loadProfessionalServices, setProfessionalBookingStatus } from '../services/professional'
import './ProfessionalArea.css'

const dates = (date, view = 'day') => agendaRange(date, view)
const statusOptions = [['all', 'Todos'], ['confirmado', 'Agendados'], ['em_atendimento', 'Em curso'], ['concluido', 'Concluídos'], ['cancelado', 'Cancelados']]
const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
const workDays = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']

function BookingCard({ booking, onChange, busy }) {
  return <article className="professional-booking">
    <div className="professional-booking-avatar" aria-hidden="true">{(booking.clienteNome || 'C').slice(0, 1).toUpperCase()}</div>
    <div className="professional-booking-copy">
      <strong>{booking.clienteNome || 'Cliente sem nome registrado'}</strong>
      <span>{booking.servico} · {booking.duracao} min</span>
      <small>{adminDateLabel(booking.data)} · {booking.horario}</small>
    </div>
    <div className="professional-booking-side">
      <span className={`professional-status professional-status-${booking.status}`}>{adminStatusName[booking.status]}</span>
      {booking.status === 'confirmado' && onChange && <button type="button" disabled={busy} onClick={() => onChange(booking, 'em_atendimento')}>Iniciar</button>}
      {booking.status === 'em_atendimento' && onChange && <button type="button" disabled={busy} onClick={() => onChange(booking, 'concluido')}>Finalizar</button>}
    </div>
  </article>
}

export function ProfessionalDashboard() {
  const { usuario } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    const today = todayInFortaleza()
    Promise.all([
      loadProfessional(usuario, controller.signal),
      loadProfessionalDashboard(usuario, controller.signal),
      loadProfessionalBookings(usuario, dates(today), controller.signal),
      loadProfessionalHours(usuario, controller.signal),
    ]).then(([person, summary, bookings, hours]) => {
      if (!Array.isArray(bookings) || !Array.isArray(hours)) throw new Error('Resposta inválida da agenda.')
      setData({ person, summary, bookings, hours })
      setError('')
    }).catch(cause => { if (!controller.signal.aborted) setError(cause.message) })
    return () => controller.abort()
  }, [usuario, retry])
  const upcoming = data?.bookings.find(item => ['confirmado', 'em_atendimento'].includes(item.status))
  return <ProfessionalPage title="PAINEL BARBEIRO">
    {error && <p className="professional-error" role="alert">{error} <button type="button" onClick={() => setRetry(value => value + 1)}>Tentar novamente</button></p>}
    {!data && !error && <p className="professional-message" role="status">Carregando painel...</p>}
    {data && <>
      <p className="professional-greeting">Olá, {data.person.nome}</p>
      <div className="professional-overview"><div><span>Hoje</span><strong>{data.summary.hoje}</strong><small>agendamentos ativos</small></div><div><span>Atendidos</span><strong>{data.summary.atendidos}</strong><small>finalizados hoje</small></div></div>
      <h2>Próximo atendimento de hoje</h2>
      {upcoming ? <BookingCard booking={upcoming} /> : <p className="professional-message">Nenhum atendimento pendente hoje.</p>}
      <h2>Minha disponibilidade</h2>
      <div className="professional-panel"><strong>{data.person.nome}</strong><span>{data.hours.length ? data.hours.map(item => workDays[item.dia - 1].slice(0, 3)).join(', ') : 'Sem horários cadastrados'}</span><small>Horários administrados pela barbearia</small></div>
      <div className="professional-section-heading"><h2>Sua agenda de hoje</h2><Link to="/profissional/agenda">Ver agenda</Link></div>
      {data.bookings.length ? data.bookings.map(item => <BookingCard key={item.id} booking={item} />) : <p className="professional-message">Nenhum agendamento para hoje.</p>}
    </>}
  </ProfessionalPage>
}

export function ProfessionalAgenda() {
  const { usuario } = useAuth()
  const [anchor, setAnchor] = useState(todayInFortaleza)
  const [view, setView] = useState('week')
  const [filter, setFilter] = useState('all')
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState('')
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const { start, end } = dates(anchor, view)
  useEffect(() => {
    const controller = new AbortController()
    loadProfessionalBookings(usuario, { start, end }, controller.signal)
      .then(rows => { if (!Array.isArray(rows)) throw new Error('Resposta inválida da agenda.'); setBookings(rows); setError('') })
      .catch(cause => { if (!controller.signal.aborted) setError(cause.message) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [usuario, start, end, retry])
  async function update(booking, status) {
    if (saving) return
    if (status === 'concluido' && !window.confirm('Finalizar este atendimento?')) return
    setSaving(booking.id)
    setError('')
    try {
      const result = await setProfessionalBookingStatus(usuario, booking.id, status)
      setBookings(rows => rows.map(item => item.id === booking.id ? { ...item, status: result.status } : item))
    } catch (cause) { setError(cause.message); setRetry(value => value + 1) }
    finally { setSaving('') }
  }
  const visible = filter === 'all' ? bookings : bookings.filter(item => item.status === filter)
  const weekDate = new Date(`${anchor}T12:00:00Z`)
  return <ProfessionalPage title="MINHA AGENDA" back>
    <div className="professional-date-control"><button type="button" onClick={() => { setLoading(true); setAnchor(value => shiftAgendaDate(value, view, -1)) }} aria-label="Período anterior">‹</button><label>Data de referência<input type="date" value={anchor} onChange={event => { if (event.target.value) { setLoading(true); setAnchor(event.target.value) } }} /></label><button type="button" onClick={() => { setLoading(true); setAnchor(value => shiftAgendaDate(value, view, 1)) }} aria-label="Próximo período">›</button></div>
    <div className="professional-switch" role="group" aria-label="Período">{[['day', 'Dia'], ['week', 'Semana'], ['month', 'Mês']].map(([value, label]) => <button key={value} type="button" aria-pressed={view === value} onClick={() => { setLoading(true); setView(value) }}>{label}</button>)}</div>
    <p className="professional-subtitle">{view === 'day' ? `${dayNames[weekDate.getUTCDay()]}, ${adminDateLabel(anchor)}` : `${adminDateLabel(start)} a ${adminDateLabel(shiftAgendaDate(end, 'day', -1))}`}</p>
    <h2>Histórico de agendamentos</h2>
    <div className="professional-filters" role="group" aria-label="Status">{statusOptions.map(([value, label]) => <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</button>)}</div>
    {error && <p className="professional-error" role="alert">{error} <button type="button" onClick={() => { setLoading(true); setRetry(value => value + 1) }}>Tentar novamente</button></p>}
    {loading && <p className="professional-message" role="status">Carregando agenda...</p>}
    {!loading && !error && !visible.length && <p className="professional-message">Nenhum agendamento neste período.</p>}
    {!loading && visible.map(item => <BookingCard key={item.id} booking={item} onChange={update} busy={saving === item.id} />)}
    {bookings.length === 100 && <p className="professional-message">Exibindo os primeiros 100 agendamentos deste período. Escolha um período menor para consultar os demais.</p>}
  </ProfessionalPage>
}

export function ProfessionalProfile() {
  const { usuario, recuperarSenha } = useAuth()
  const [tab, setTab] = useState('servicos')
  const [person, setPerson] = useState(null)
  const [hours, setHours] = useState([])
  const [services, setServices] = useState([])
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  useEffect(() => {
    const controller = new AbortController()
    Promise.all([loadProfessional(usuario, controller.signal), loadProfessionalHours(usuario, controller.signal), loadProfessionalServices(usuario, controller.signal)])
      .then(([p, h, s]) => { setPerson(p); setHours(h); setServices(s) })
      .catch(cause => { if (!controller.signal.aborted) setError(cause.message) })
    return () => controller.abort()
  }, [usuario])
  async function resetPassword() {
    setError(''); setNotice('')
    try { await recuperarSenha(usuario.email); setNotice('Enviamos um link de redefinição para seu e-mail.') }
    catch (cause) { setError(cause.message) }
  }
  return <ProfessionalPage title="PERFIL" back>
    <section className="professional-identity"><div aria-hidden="true">{(person?.nome || usuario.displayName || 'P').slice(0, 1)}</div><h2>{person?.nome || 'Profissional'}</h2><p>{usuario.email}</p></section>
    <div className="professional-filters professional-profile-tabs" role="tablist" aria-label="Perfil">{[['servicos', 'Meus serviços'], ['seguranca', 'Segurança'], ['disponibilidade', 'Minha disponibilidade'], ['avaliacoes', 'Minhas avaliações']].map(([value, label]) => <button key={value} type="button" role="tab" aria-selected={tab === value} onClick={() => { setTab(value); setError(''); setNotice('') }}>{label}</button>)}</div>
    {error && <p className="professional-error" role="alert">{error}</p>}{notice && <p className="professional-message" role="status">{notice}</p>}
    {tab === 'servicos' && <section><h2>Serviços da barbearia</h2><p className="professional-subtitle">Serviços disponíveis para agendamento com a equipe.</p>{services.map(item => <div className="professional-service" key={item.id}><span>✂</span><strong>{item.nome}<small>{item.duracao} min</small></strong><b>R$ {Number(item.preco).toFixed(2).replace('.', ',')}</b></div>)}</section>}
    {tab === 'seguranca' && <section className="professional-panel"><h2>Segurança</h2><p>Para trocar sua senha, receba um link no e-mail da sua conta.</p><button type="button" onClick={resetPassword}>Enviar link para redefinir senha</button></section>}
    {tab === 'disponibilidade' && <section><h2>Minha disponibilidade</h2><div className="professional-panel"><strong>Horário de trabalho</strong>{hours.length ? hours.map(item => <p key={item.dia}>{workDays[item.dia - 1]}: {item.abertura}–{item.fechamento}</p>) : <p>Sem horários cadastrados.</p>}</div><p className="professional-subtitle">Para mudar seus horários, solicite a alteração à administração da barbearia.</p></section>}
    {tab === 'avaliacoes' && <section><h2>Minhas avaliações</h2><p className="professional-message">As avaliações ainda não estão integradas ao banco de dados.</p></section>}
  </ProfessionalPage>
}

export function ProfessionalNotifications() {
  return <ProfessionalPage title="NOTIFICAÇÕES" back><p className="professional-message">As notificações de agendamento ainda não estão disponíveis. Consulte sua agenda para ver os atendimentos atualizados.</p></ProfessionalPage>
}
