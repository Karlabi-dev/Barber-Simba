import { Link } from 'react-router-dom'
import AppShell from '../components/AppShell'
import NotificationBell from '../components/NotificationBell'
import { useNotifications } from '../hooks/useNotifications'
import './Notifications.css'
function groupDate(value) {
  const date = new Date(value), today = new Date(), yesterday = new Date()
  yesterday.setDate(today.getDate()-1)
  if (date.toDateString() === today.toDateString()) return 'Hoje'
  if (date.toDateString() === yesterday.toDateString()) return 'Ontem'
  return date.toLocaleDateString('pt-BR')
}
function relativeTime(value) {
  const minutes = Math.max(0, Math.floor((Date.now()-new Date(value).getTime())/60000))
  if (minutes < 1) return 'Agora'
  if (minutes < 60) return `Há ${minutes} min`
  if (minutes < 1440) return `Há ${Math.floor(minutes/60)} h`
  return new Date(value).toLocaleString('pt-BR', {day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})
}
export default function Notifications() {
  const { items, error, markAllRead } = useNotifications()
  const groups = Object.groupBy(items, item => groupDate(item.createdAt))
  return <AppShell nav={false} className="notifications-screen">
    <header className="notifications-heading"><Link to="/home" aria-label="Voltar para início">‹</Link><h1>NOTIFICAÇÕES</h1></header>
    {items.some(item => !item.read) && <button className="notifications-read" onClick={markAllRead}>Marcar todas como lidas</button>}
    {error && <p role="alert">{error}</p>}
    {!items.length && !error && <p className="notifications-empty">Nenhuma notificação por enquanto. Seus avisos de agendamento aparecerão aqui.</p>}
    {Object.entries(groups).map(([title, notifications]) => <section className="notification-group" key={title}><h2>{title}</h2>{notifications.map(item => <Link className={`notification-card ${item.read ? '' : 'unread'}`} key={item.id} to="/agendas">
      <span className={`notification-symbol ${item.type}`}><NotificationBell /></span>
      <div><h3>{item.title}</h3><p>{item.message}</p><time dateTime={item.createdAt}>{relativeTime(item.createdAt)}</time></div>
    </Link>)}</section>)}
  </AppShell>
}
