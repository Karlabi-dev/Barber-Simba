import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AdminPage from '../components/AdminPage'
import { adminDateLabel, adminStatusName } from '../services/adminLabels'
import { useAuth } from '../hooks/useAuth'
import { loadAdminBooking, setAdminBookingStatus } from '../services/admin'
import './AdminAgenda.css'

export default function AdminBookingDetails() {
  const { id } = useParams()
  const { usuario } = useAuth()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    loadAdminBooking(usuario, id, controller.signal)
      .then(item => { setBooking(item); setError('') })
      .catch(cause => { if (!controller.signal.aborted) setError(cause.message) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [usuario, id, retry])

  async function update(status) {
    if (saving) return
    if (status === 'cancelado' && !window.confirm('Cancelar este agendamento?')) return
    if (status === 'concluido' && !window.confirm('Finalizar este atendimento?')) return
    setSaving(true)
    setError('')
    try {
      const result = await setAdminBookingStatus(usuario, id, status)
      setBooking(current => ({ ...current, status: result.status }))
    } catch (cause) {
      setError(cause.message)
      if (cause.message.includes('mudou de estado')) {
        try { setBooking(await loadAdminBooking(usuario, id)) } catch { /* mantém o erro original */ }
      }
    } finally { setSaving(false) }
  }

  return <AdminPage title="DETALHES DO SERVIÇO">
    <Link className="admin-agenda-back" to="/admin/agenda">← Voltar à agenda</Link>
    {loading && <p className="admin-feedback" role="status">Carregando atendimento...</p>}
    {error && <p className="admin-error" role="alert">{error} {!booking && <button type="button" onClick={() => { setLoading(true); setRetry(value => value + 1) }}>Tentar novamente</button>}</p>}
    {booking && <>
      <section className="admin-detail-card" aria-label="Dados do atendimento">
        <strong>{booking.clienteNome || 'Cliente sem nome registrado'}</strong>
        {!booking.clienteNome && <small>Identificador da conta: {booking.firebaseUid}</small>}
        <div><span>Profissional</span><b>{booking.profissional}</b></div>
        <div><span>Serviço</span><b>{booking.servico}</b></div>
        <div><span>Data e horário</span><b>{adminDateLabel(booking.data)} · {booking.horario}</b></div>
        <div><span>Observações</span><b>{booking.observacoes || 'Nenhuma observação'}</b></div>
      </section>
      <section className="admin-detail-status" aria-label="Status do atendimento">
        <h2>Status do atendimento</h2>
        {['confirmado', 'em_atendimento', 'concluido'].map((status, index) => <div key={status} className={booking.status === status || (booking.status !== 'cancelado' && ['confirmado', 'em_atendimento', 'concluido'].indexOf(booking.status) > index) ? 'reached' : ''}><span aria-hidden="true">●</span>{adminStatusName[status]}</div>)}
        {booking.status === 'cancelado' && <p className="admin-detail-cancelled">Agendamento cancelado</p>}
      </section>
      <div className="admin-detail-actions">
        {booking.status === 'confirmado' && <><button type="button" onClick={() => update('em_atendimento')} disabled={saving}>{saving ? 'Salvando...' : 'Iniciar atendimento'}</button><button type="button" className="secondary" onClick={() => update('cancelado')} disabled={saving}>Cancelar agendamento</button></>}
        {booking.status === 'em_atendimento' && <button type="button" onClick={() => update('concluido')} disabled={saving}>{saving ? 'Salvando...' : 'Finalizar atendimento'}</button>}
      </div>
    </>}
  </AdminPage>
}
