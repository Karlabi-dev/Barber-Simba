import Navbar from './Navbar'

export default function AppShell({ children, nav = true, className = '' }) {
  return <main className={`app-shell${nav ? ' with-navbar' : ''}${className ? ` ${className}` : ''}`}>
    <div className="screen-content">{children}</div>{nav && <Navbar />}
  </main>
}
