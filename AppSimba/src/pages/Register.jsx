import PasswordInput from '../components/PasswordInput'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { authErrorMessage } from '../services/authErrors'
import AuthLayout from '../components/AuthLayout'
import AuthDialog from '../components/AuthDialog'

export default function Register() {
  const { cadastrar, carregando, erroSessao } = useAuth()
  const navigate = useNavigate()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  async function submit(event) {
    event.preventDefault()
    if (busy || success) return
    if (!nome.trim()) { setError('Informe seu nome.'); return }
    if (senha !== confirmar) { setError('As senhas não coincidem.'); return }
    setError(''); setBusy(true)
    try {
      await cadastrar(email, senha, nome)
      setSenha(''); setConfirmar(''); setSuccess(true)
    } catch(e) { setError(authErrorMessage(e)) }
    finally { setBusy(false) }
  }
  return <AuthLayout cadastro>
    <header className="auth-heading"><Link to="/login" aria-label="Voltar ao login">←</Link><h1>Cadastro</h1></header>
    <form className="auth-form" onSubmit={submit}>
      <label>Nome<input autoComplete="name" placeholder="Nome" maxLength={100} value={nome} onChange={e => setNome(e.target.value)} required disabled={busy || success} /></label>
      <label>Email<input type="email" autoComplete="email" placeholder="Simba@gmail.com" value={email} onChange={e => setEmail(e.target.value)} required disabled={busy || success} /></label>
      <PasswordInput label="Senha" autoComplete="new-password" placeholder="******" minLength={6} value={senha} onChange={e => setSenha(e.target.value)} required disabled={busy || success} />
      <PasswordInput label="Confirmar senha" autoComplete="new-password" placeholder="******" minLength={6} value={confirmar} onChange={e => setConfirmar(e.target.value)} required disabled={busy || success} />
      {(error || erroSessao) && <p role="alert" className="auth-error">{error || erroSessao}</p>}
      <button className="auth-submit" type="submit" disabled={busy || success || carregando || !!erroSessao}>{busy ? 'Cadastrando...' : 'Confirmar cadastro'}</button>
    </form>
    {success && <AuthDialog title="Cadastro confirmado com sucesso" onClose={() => navigate('/login', {replace:true})}><p>Entre com seu e-mail e senha para continuar.</p></AuthDialog>}
  </AuthLayout>
}
