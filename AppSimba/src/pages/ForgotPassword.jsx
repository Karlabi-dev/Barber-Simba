import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import AuthDialog from '../components/AuthDialog'
import { authService } from '../services/auth'
import { authErrorMessage } from '../services/authErrors'
import bell from '../assets/icons/sino.png'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  async function submit(event) {
    event.preventDefault()
    if (busy || sent) return
    setBusy(true); setError('')
    try { await authService.recuperarSenha(email); setSent(true) }
    catch (e) {
      if (e.code === 'auth/user-not-found') setSent(true)
      else setError(authErrorMessage(e))
    } finally { setBusy(false) }
  }
  return <AuthLayout recovery>
    <header className="auth-heading"><Link to="/login" aria-label="Voltar ao login">←</Link><h1>ESQUECEU A SENHA</h1></header>
    <form className="auth-form" onSubmit={submit}>
      <label>Insira o email<input type="email" autoComplete="email" placeholder="******" value={email} onChange={e => setEmail(e.target.value)} required disabled={busy || sent} /></label>
      {error && <p className="auth-error" role="alert">{error}</p>}
      <button className="auth-submit" disabled={busy || sent}>{busy ? 'Enviando...' : 'Enviar email'}</button>
    </form>
    <aside className="auth-reminder"><img src={bell} alt="" /><p>Lembrete: Enviaremos notificações de confirmação e instruções de troca de senha por e-mail.</p></aside>
    {sent && <AuthDialog title="Confira seu e-mail" onClose={() => setSent(false)}><p>Se houver uma conta para esse e-mail, você receberá o link para redefinir sua senha. Confira também o spam.</p></AuthDialog>}
  </AuthLayout>
}
