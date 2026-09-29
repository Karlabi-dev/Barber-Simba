import { useState } from 'react'
import { Link } from 'react-router-dom'
import AppShell from '../components/AppShell'
import { readBookingHistory, updateBookingStatus } from '../data/booking'
import { barbeiros } from '../data/barbeiros'
import './BookingHistory.css'

const filters = [['todos', 'Todos'], ['confirmado', 'Confirmados'], ['concluido', 'Concluídos'], ['cancelado', 'Cancelados']]
export default function BookingHistory() {
  const [filter, setFilter] = useState('todos')
  const [bookings, setBookings] = useState(readBookingHistory)
  const [error, setError] = useState('')
  function cancel(id) {
    if (!window.confirm('Deseja cancelar este agendamento?')) return
    try { setBookings(updateBookingStatus(id, 'cancelado')); setError('') }
    catch { setError('Não foi possível salvar o cancelamento. Tente novamente.') }
  }
  const visible = bookings.filter(item => filter === 'todos' || item.status === filter)
  return <AppShell className="history-screen">
    <header className="history-header">
      <Link className="history-circle" to="/home" aria-label="Voltar para início">←</Link>
      <h1>HISTÓRICO DE AGENDAMENTO</h1>
      <Link className="history-circle" to="/agendamento" aria-label="Novo agendamento">+</Link>
    </header>
    <h2>Histórico de Agendamentos</h2>
    <div className="history-filters" role="group" aria-label="Filtrar agendamentos">
      {filters.map(([value, label]) => <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}{value === 'todos' ? ` (${bookings.length})` : ''}</button>)}
    </div>
    {error && <p role="alert">{error}</p>}
    <div className="history-list">
      {visible.map(item => {
        const barber = barbeiros.find(person => person.nome === item.profissional)
        const date = new Date(`${item.data}T12:00:00`).toLocaleDateString('pt-BR', {day:'numeric', month:'short'})
        return <article className="history-card" key={item.id}>
          {barber && <img className="history-avatar" src={barber.foto} alt="" />}
          <div className="history-details"><div className="history-name"><h3>{item.profissional}</h3><span className={`history-status ${item.status}`}>{item.status === 'concluido' ? 'Concluído' : item.status === 'cancelado' ? 'Cancelado' : 'Agendado'}</span></div>
            <p>{item.servico}</p><time dateTime={`${item.data}T${item.horario}`}>{date} · {item.horario}</time>
          </div>
          <div className="history-actions">{item.status === 'confirmado' ? <button type="button" onClick={() => cancel(item.id)}>CANCELAR</button> : <span className={item.status}>{item.status === 'concluido' ? 'FINALIZADO' : 'CANCELADO'}</span>}</div>
        </article>
      })}
      {!visible.length && <div className="history-empty"><p>{filter === 'todos' ? 'Você ainda não tem agendamentos.' : 'Nenhum agendamento neste filtro.'}</p><Link to="/agendamento">Novo agendamento</Link></div>}
    </div>
  </AppShell>
}
