import { NavLink } from 'react-router-dom'
import homeIcon from '../assets/icons/home.png'
import calendarIcon from '../assets/icons/calendario.png'
import servicesIcon from '../assets/icons/servicos.png'
import profileIcon from '../assets/icons/perfil.png'

const items = [
  { to: '/home', label: 'Home', icon: homeIcon },
  { to: '/agendamento', label: 'Agendas', icon: calendarIcon },
  { to: '/servicos', label: 'Serviços', icon: servicesIcon },
  { to: '/perfil', label: 'Perfil', icon: profileIcon },
]

export default function Navbar() {
  return <nav className="navbar" aria-label="Navegação principal">{items.map((item) => (
    <NavLink key={item.to} to={item.to} className={({ isActive }) => isActive ? 'active' : ''}>
      <img src={item.icon} alt="" /><span>{item.label}</span>
    </NavLink>
  ))}</nav>
}
