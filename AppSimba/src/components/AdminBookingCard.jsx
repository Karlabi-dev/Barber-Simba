import { Link } from 'react-router-dom'
import { adminDateLabel, adminStatusName } from '../services/adminLabels'

export default function AdminBookingCard({ booking }) {
  return <Link className="admin-booking" to={`/admin/agendamentos/${booking.id}`} aria-label={`Detalhes do atendimento: ${booking.servico}, ${adminDateLabel(booking.data)} às ${booking.horario}`}>
    <div className="admin-booking-icon" aria-hidden="true">✂</div>
    <div className="admin-booking-main">
      <strong>{booking.clienteNome || 'Cliente sem nome registrado'}</strong>
      <span>{booking.servico} · {booking.profissional}</span>
      <time dateTime={`${booking.data}T${booking.horario}`}>{adminDateLabel(booking.data)} · {booking.horario}</time>
    </div>
    <span className={`admin-booking-status admin-booking-status-${booking.status}`}>{adminStatusName[booking.status] || booking.status}</span>
  </Link>
}
