import PasswordInput from '../components/PasswordInput'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import AuthDialog from '../components/AuthDialog'
import { authService } from '../services/auth'
import { authErrorMessage } from '../services/authErrors'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const code = params.get('oobCode') || ''
  const mode = params.get('mode')
  // Remount the form if a different email action is opened in the same tab.
  return <ResetForm key={`${mode}:${code}`} code={code} mode={mode} />
}

function ResetForm({ code, mode }) {
  const navigate = useNavigate()
  const [status, setStatus] = useState('checking')
  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [success, setSuccess] = useState(false)
  useEffect(() => {
    let active = true
    const validation = !code || mode !== 'resetPassword'
      ? Promise.reject({ code: 'auth/invalid-action-code' })
      : authService.verificarRedefinicao(code)
    validation.then(() => { if (active) setStatus('ready') }).catch(e => {
      if (active) { setStatus('invalid'); setError(authErrorMessage(e)) }
    })
    return () => { active = false }
  }, [code, mode])
  async function submit(event) {
    event.preventDefault()
    if (busy || success || status !== 'ready') return
    if (senha !== confirmar) { setError('As senhas não coincidem.'); return }
    setBusy(true); setError('')
    try {
      await authService.redefinirSenha(code, senha)
      setSenha(''); setConfirmar(''); setSuccess(true)
      // Remove the consumed code from browser history without unmounting the popup.
      window.history.replaceState(window.history.state, '', '/atualizar-senha')
    } catch (e) {
      setError(authErrorMessage(e))
      if (['auth/expired-action-code', 'auth/invalid-action-code'].includes(e.code)) setStatus('invalid')
    } finally { setBusy(false) }
  }
  const disabled = status !== 'ready' || busy || success
  return <AuthLayout recovery>
    <header className="auth-heading"><Link to="/login" aria-label="Voltar ao login">←</Link><h1>ATUALIZAR SENHA</h1></header>
    <form className="auth-form" onSubmit={submit}>
      <PasswordInput label="Insira a nova senha" autoComplete="new-password" placeholder="******" minLength={6} required value={senha} onChange={e => setSenha(e.target.value)} disabled={disabled} />
      <PasswordInput label="Repita a nova senha" autoComplete="new-password" placeholder="******" minLength={6} required value={confirmar} onChange={e => setConfirmar(e.target.value)} disabled={disabled} />
      {status === 'checking' && <p className="auth-status" role="status">Verificando link...</p>}
      {error && <p className="auth-error" role="alert">{error}</p>}
      {status === 'invalid' && <Link className="auth-retry" to="/esqueci-senha">Solicitar novo link</Link>}
      <button className="auth-submit" disabled={disabled}>{busy ? 'Confirmando...' : 'Confirmar nova senha'}</button>
    </form>
    {success && <AuthDialog title="Senha redefinida com sucesso!" onClose={() => navigate('/login', { replace: true })}><p>Entre com sua nova senha para continuar.</p></AuthDialog>}
  </AuthLayout>
}
