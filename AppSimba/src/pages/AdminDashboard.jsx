import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { loadAdminBookings, loadAdminDashboard } from '../services/admin'
import AdminPage from '../components/AdminPage'
import './AdminDashboard.css'

const filters = [
  ['today', 'Hoje'],
  ['upcoming', 'Próximos'],
  ['all', 'Ver todos'],
]

const statusLabel = { confirmado: 'Agendado', concluido: 'Finalizado', cancelado: 'Cancelado' }

function formatDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return value || ''
  return new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export default function AdminDashboard() {
  const { usuario } = useAuth()
  const [filter, setFilter] = useState('today')
  const [summary, setSummary] = useState(null)
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    loadAdminDashboard(usuario, controller.signal)
      .then(setSummary)
      .catch(cause => { if (!controller.signal.aborted) setError(cause.message) })
    return () => controller.abort()
  }, [usuario, retry])

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setBookings([])
    setHasMore(false)
    setError('')
    loadAdminBookings(usuario, filter, 0, controller.signal)
      .then(rows => {
        if (!Array.isArray(rows)) throw new Error('Resposta inválida dos agendamentos.')
        setBookings(rows)
        setHasMore(rows.length === 100)
      })
      .catch(cause => { if (!controller.signal.aborted) setError(cause.message) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [usuario, filter, retry])

  async function more() {
    if (loadingMore) return
    setLoadingMore(true)
    setError('')
    try {
      const rows = await loadAdminBookings(usuario, filter, bookings.length)
      if (!Array.isArray(rows)) throw new Error('Resposta inválida dos agendamentos.')
      setBookings(current => [...current, ...rows])
      setHasMore(rows.length === 100)
    } catch (cause) { setError(cause.message) }
    finally { setLoadingMore(false) }
  }

  return <AdminPage title="PAINEL ADMIN">
    <section className="admin-overview" aria-label="Resumo de hoje">
      <div><span>Hoje</span><strong>{summary?.totalHoje ?? '—'}</strong><small>agendamentos</small></div>
      <div><span>Aguardando</span><strong>{summary?.aguardandoHoje ?? '—'}</strong><small>hoje</small></div>
      <div><span>Finalizados</span><strong>{summary?.concluidosHoje ?? '—'}</strong><small>hoje</small></div>
    </section>

    <section className="admin-appointments" aria-labelledby="admin-appointments-title">
      <h2 id="admin-appointments-title">Atendimentos</h2>
      <div className="admin-filters" role="group" aria-label="Filtrar atendimentos">
        {filters.map(([value, label]) => <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</button>)}
      </div>
      {error && <div className="admin-error" role="alert">{error} <button type="button" onClick={() => setRetry(value => value + 1)}>Tentar novamente</button></div>}
      {loading && <p className="admin-feedback" role="status">Carregando agendamentos...</p>}
      {!loading && !error && !bookings.length && <p className="admin-feedback">Nenhum atendimento neste período.</p>}
      <div className="admin-list">
        {bookings.map(booking => <article className="admin-booking" key={booking.id}>
          <div className="admin-booking-icon" aria-hidden="true">✂</div>
          <div className="admin-booking-main">
            <strong>{booking.servico}</strong>
            <span>Profissional: {booking.profissional}</span>
            <time dateTime={`${booking.data}T${booking.horario}`}>{formatDate(booking.data)} · {booking.horario}</time>
          </div>
          <span className={`admin-booking-status admin-booking-status-${booking.status}`}>{statusLabel[booking.status] || booking.status}</span>
        </article>)}
      </div>
      {hasMore && !loading && <button className="admin-more" type="button" onClick={more} disabled={loadingMore}>{loadingMore ? 'Carregando...' : 'Carregar mais'}</button>}
    </section>
  </AdminPage>
}
