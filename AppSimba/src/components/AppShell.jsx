import Navbar from './Navbar'

export default function AppShell({ children, nav = true, className = '' }) {
  return <main className={`app-shell ${className}`}>
    <div className="status-bar"><strong>9:41</strong><span>▮▮▮ ))) ▰</span></div>
    <div className="screen-content">{children}</div>{nav && <Navbar />}
  </main>
}
