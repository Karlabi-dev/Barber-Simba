import { NavLink } from 'react-router-dom'

const items = [
  { to: '/home', label: 'Home', icon: <><path d="m3 10 9-7 9 7" /><path d="M5 9v12h5v-7h4v7h5V9" /></> },
  { to: '/agendamento', label: 'Agendas', icon: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4m10-4v4M3 11h18M7 15h2m2 0h2m2 0h2M7 18h2m2 0h2" /></> },
  { to: '/servicos', label: 'Serviços', icon: <><circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="m8.2 8.2 12.8 12.8M8.2 15.8 21 3" /></> },
  { to: '/perfil', label: 'Perfil', icon: <><circle cx="12" cy="7" r="4" /><path d="M4 21v-2a8 8 0 0 1 16 0v2" /></> },
]

export default function Navbar() {
  return <nav className="navbar" aria-label="Navegação principal">{items.map((item) => (
    <NavLink key={item.to} to={item.to} className={({ isActive }) => isActive ? 'active' : ''}>
      <svg className="navbar-icon" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{item.icon}</svg><span>{item.label}</span>
    </NavLink>
  ))}</nav>
}
