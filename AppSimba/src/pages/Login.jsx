import PasswordInput from '../components/PasswordInput'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { authErrorMessage } from '../services/authErrors'
import AuthLayout from '../components/AuthLayout'
import { homeForRole, roleFromClaims } from '../services/roles'

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
    try {
      const user = await entrar(email, senha)
      const { claims } = await user.getIdTokenResult(true)
      navigate(homeForRole(roleFromClaims(claims)), { replace: true })
    }
    catch (e) { setError(authErrorMessage(e)) }
    finally { setBusy(false) }
  }
  return <AuthLayout>
    <p className="auth-subtitle">Sistema Moderno de Barbearia</p>
    <form className="auth-form" onSubmit={submit}>
      <label className="auth-email-label">E-mail<input aria-label="E-mail" type="email" autoComplete="username" placeholder="seuemail@gmail.com" value={email} onChange={e => setEmail(e.target.value)} required disabled={busy} /></label>
      <PasswordInput label="Senha" autoComplete="current-password" placeholder="******" value={senha} onChange={e => setSenha(e.target.value)} required disabled={busy} />
      <p className="auth-forgot">Esqueceu a senha? <Link to="/esqueci-senha">Clique aqui</Link></p>
      {(error || erroSessao) && <p className="auth-error" role="alert">{error || erroSessao}</p>}
      <button className="auth-submit" type="submit" disabled={busy || carregando || !!erroSessao}>{busy ? 'Aguarde...' : 'Entrar'}</button>
      <p className="auth-signup">Não possui um cadastro? <Link to="/cadastro">Clique aqui</Link></p>
    </form>
  </AuthLayout>
}
