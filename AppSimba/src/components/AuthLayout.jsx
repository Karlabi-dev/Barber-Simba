import '../auth.css'

export default function AuthLayout({ children, cadastro = false }) {
  return <main className={cadastro ? 'auth-screen auth-register' : 'auth-screen auth-login'}>
    <div className="auth-brand" role="img" aria-label="SIMBA" />
    {children}
    <div className="auth-track" aria-hidden="true"><span /></div>
  </main>
}
