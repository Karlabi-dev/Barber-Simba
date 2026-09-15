import '../auth.css'

export default function AuthLayout({ children, cadastro = false, recovery = false }) {
  return <main className={recovery ? 'auth-screen auth-register auth-recovery' : cadastro ? 'auth-screen auth-register' : 'auth-screen auth-login'}>
    <div className="auth-brand" role="img" aria-label="SIMBA" />
    {children}
    <div className="auth-track" aria-hidden="true"><span /></div>
  </main>
}
