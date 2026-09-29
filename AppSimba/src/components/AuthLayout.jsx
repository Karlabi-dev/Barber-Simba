import '../auth.css'

export default function AuthLayout({ children, cadastro = false, recovery = false }) {
  return <main className={recovery ? 'auth-screen auth-register auth-recovery' : cadastro ? 'auth-screen auth-register' : 'auth-screen auth-login'}>
    {cadastro || recovery ? <div className="auth-brand" role="img" aria-label="SIMBA" /> : <div className="auth-login-brand"><span className="auth-login-lion" aria-hidden="true" /><span>SIMBA</span></div>}
    {children}
    {(cadastro || recovery) && <div className="auth-track" aria-hidden="true"><span /></div>}
  </main>
}
