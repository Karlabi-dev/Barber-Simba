import { NavLink, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import '../pages/AdminDashboard.css'

const links = [
  ['/admin', 'Início', <><path d="m3 10 9-7 9 7" /><path d="M5 9v12h5v-7h4v7h5V9" /></>],
  ['/admin/servicos', 'Serviços', <><circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="m8.2 8.2 12.8 12.8M8.2 15.8 21 3" /></>],
  ['/admin/equipe', 'Equipe', <><circle cx="9" cy="7" r="3" /><path d="M3 21v-3a6 6 0 0 1 12 0v3m2-16a3 3 0 0 1 0 6m2 10v-3a6 6 0 0 0-2-4" /></>],
]

export default function AdminPage({ title, onAdd, children }) {
  const { sair } = useAuth()
  return <main className="admin-shell">
    <div className="admin-statusbar" aria-hidden="true"><strong>9:41</strong><span>▮▮▮ ))) ▰</span></div>
    <header className="admin-header">
      {title === 'PAINEL ADMIN' ? <span className="admin-mark" aria-hidden="true">♛</span> : <Link className="admin-back" to="/admin" aria-label="Voltar ao painel">‹</Link>}
      <h1>{title}</h1>
      {onAdd && <button className="admin-add" type="button" onClick={onAdd} aria-label={`Adicionar em ${title.toLowerCase()}`}>+</button>}
      <button className="admin-signout" type="button" onClick={sair} aria-label="Sair da conta">Sair</button>
    </header>
    {children}
    <nav className="admin-footer" aria-label="Navegação administrativa">
      {links.map(([to, label, icon]) => <NavLink key={to} to={to} end={to === '/admin'} className={({ isActive }) => isActive ? 'active' : ''}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{icon}</svg><small>{label}</small></NavLink>)}
    </nav>
  </main>
}
