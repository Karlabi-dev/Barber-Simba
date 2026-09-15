import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { authErrorMessage } from '../services/authErrors'
import AuthLayout from '../components/AuthLayout'
import AuthDialog from '../components/AuthDialog'

export default function Login() {
  const { entrar, recuperarSenha, carregando, erroSessao } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [reset, setReset] = useState(false)
  async function submit(event) {
    event.preventDefault()
    if (busy) return
    setError(''); setBusy(true)
    try { await entrar(email, senha); navigate('/home', {replace:true}) }
    catch (e) { setError(authErrorMessage(e)) }
    finally { setBusy(false) }
  }
  async function recover() {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Preencha seu e-mail no campo acima para recuperar a senha.'); return
    }
    setError(''); setBusy(true)
    try { await recuperarSenha(email); setReset(true) }
    catch(e) { setError(authErrorMessage(e)) }
    finally { setBusy(false) }
  }
  return <AuthLayout>
    <p className="auth-subtitle">Sistema Moderno de Barbearia</p>
    <form className="auth-form" onSubmit={submit}>
      <input aria-label="Email" type="email" autoComplete="username" placeholder="Simba@gmail.com" value={email} onChange={e => setEmail(e.target.value)} required disabled={busy} />
      <input aria-label="Senha" type="password" autoComplete="current-password" placeholder="******" value={senha} onChange={e => setSenha(e.target.value)} required disabled={busy} />
      <p className="auth-forgot">Esqueceu a senha? <button type="button" onClick={recover} disabled={busy || carregando}>clique aqui</button></p>
      {(error || erroSessao) && <p className="auth-error" role="alert">{error || erroSessao}</p>}
      <button className="auth-submit" type="submit" disabled={busy || carregando || !!erroSessao}>{busy ? 'Aguarde...' : 'Entrar'}</button>
      <p className="auth-signup">Não possui uma conta? <Link to="/cadastro">clique aqui</Link></p>
    </form>
    {reset && <AuthDialog title="Recuperação de senha" onClose={() => setReset(false)}><p>Se houver uma conta para esse e-mail, você receberá as instruções de recuperação. Confira também o spam.</p></AuthDialog>}
  </AuthLayout>
}
