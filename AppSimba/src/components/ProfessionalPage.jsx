import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import '../pages/ProfessionalArea.css'

const links = [['/profissional', 'Início', '⌂'], ['/profissional/agenda', 'Agenda', '▦'], ['/profissional/perfil', 'Perfil', '♙']]

export default function ProfessionalPage({ title, children, back = false }) {
  const { sair } = useAuth()
  return <main className="professional-shell">
    <header className="professional-header">
      {back ? <Link to="/profissional" className="professional-back" aria-label="Voltar ao início">‹</Link> : <span className="professional-brand" aria-hidden="true">♛</span>}
      <h1>{title}</h1>
      <Link to="/profissional/notificacoes" className="professional-bell" aria-label="Notificações"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" /></svg></Link>
      <button type="button" onClick={sair} className="professional-signout">Sair</button>
    </header>
    {children}
    <nav className="professional-footer" aria-label="Navegação do profissional">
      {links.map(([to, label, icon]) => <NavLink key={to} to={to} end={to === '/profissional'} className={({ isActive }) => isActive ? 'active' : ''}><span aria-hidden="true">{icon}</span><small>{label}</small></NavLink>)}
    </nav>
  </main>
}
