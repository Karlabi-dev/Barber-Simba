import { Link } from 'react-router-dom'
import NotificationBell from './NotificationBell'
import { useNotifications } from '../hooks/useNotifications'
import '../pages/Notifications.css'

export default function Header({ title, backTo, compact = false }) {
  const { items: notifications } = useNotifications()
  const unread = notifications.filter(item => !item.read).length
  if (compact) return <header className="page-header">
    <Link className="icon-button" to={backTo || '/home'} aria-label="Voltar">←</Link>
    <h1>{title}</h1><span className="header-spacer" />
  </header>

  return <header className="brand-header">
    <Link className="brand" to="/home">SIMBA</Link>
    <Link className="notifications-bell" to="/notificacoes" aria-label={`Notificações, ${unread} não lidas`}><NotificationBell />{unread > 0 && <span className="notifications-badge">{unread > 99 ? "99+" : unread}</span>}</Link>
  </header>
}
