import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { authErrorMessage } from '../services/authErrors'
import AuthLayout from '../components/AuthLayout'

export default function Login() {
  const { entrar, carregando, erroSessao } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function submit(event) {
    event.preventDefault()
    if (busy) return
    setError(''); setBusy(true)
    try { await entrar(email, senha); navigate('/home', {replace:true}) }
    catch (e) { setError(authErrorMessage(e)) }
    finally { setBusy(false) }
  }
  return <AuthLayout>
    <p className="auth-subtitle">Sistema Moderno de Barbearia</p>
    <form className="auth-form" onSubmit={submit}>
      <input aria-label="Email" type="email" autoComplete="username" placeholder="Simba@gmail.com" value={email} onChange={e => setEmail(e.target.value)} required disabled={busy} />
      <input aria-label="Senha" type="password" autoComplete="current-password" placeholder="******" value={senha} onChange={e => setSenha(e.target.value)} required disabled={busy} />
      <p className="auth-forgot">Esqueceu a senha? <Link to="/esqueci-senha">Clique aqui</Link></p>
      {(error || erroSessao) && <p className="auth-error" role="alert">{error || erroSessao}</p>}
      <button className="auth-submit" type="submit" disabled={busy || carregando || !!erroSessao}>{busy ? 'Aguarde...' : 'Entrar'}</button>
      <p className="auth-signup">Não possui uma conta? <Link to="/cadastro">Clique aqui</Link></p>
    </form>
  </AuthLayout>
}
