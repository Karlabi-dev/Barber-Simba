import { useEffect, useState } from 'react'
import AppShell from '../components/AppShell'
import Header from '../components/Header'
import PasswordInput from '../components/PasswordInput'
import { useAuth } from '../hooks/useAuth'
import './Profile.css'

const PROFILE_KEY = 'simba-profile'
const fallback = { nome: 'Guilherme Campos', nascimento: '', celular: '+55 85 9 9435-6543', genero: 'Masculino', sobre: '' }
function readProfile() {
  try { return {...fallback, ...(JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}'))} } catch { return fallback }
}

export default function Profile() {
  const { usuario, atualizarPerfil, alterarEmail, alterarSenha, sair } = useAuth()
  const [tab, setTab] = useState('dados')
  const [profile, setProfile] = useState(readProfile)
  const [email, setEmail] = useState(usuario?.email || 'guilherme@gmail.com')
  const [senha, setSenha] = useState({ atual: '', nova: '', confirmar: '' })
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [editingEmail, setEditingEmail] = useState(false)
  useEffect(() => { setEmail(usuario?.email || 'guilherme@gmail.com'); if (usuario?.displayName) setProfile(value => ({...value, nome:usuario.displayName})) }, [usuario])
  function change(event) { setProfile({...profile, [event.target.name]: event.target.value}) }
  async function saveProfile(event) {
    event.preventDefault(); setError(''); setNotice('')
    try { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); if (usuario && profile.nome.trim()) await atualizarPerfil(usuario, {displayName:profile.nome.trim()}); setNotice('Dados salvos com sucesso.') }
    catch (cause) { setError(cause.message || 'Não foi possível salvar os dados.') }
  }
  async function saveSecurity(event) {
    event.preventDefault(); setError(''); setNotice('')
    if (senha.nova && senha.nova !== senha.confirmar) { setError('A confirmação da senha não confere.'); return }
    try { if (usuario && senha.nova) await alterarSenha(usuario, senha.nova); if (usuario && editingEmail && email.trim() !== usuario.email) await alterarEmail(usuario, email); setSenha({atual:'', nova:'', confirmar:''}); setEditingEmail(false); setNotice('Segurança atualizada com sucesso.') }
    catch (cause) { setError(cause.code === 'auth/requires-recent-login' ? 'Entre novamente na conta para alterar a senha ou o e-mail.' : (cause.message || 'Não foi possível atualizar a segurança.')) }
  }
  return <AppShell className="profile-screen"><Header compact title="PERFIL" />
    <section className="profile-identity"><div className="profile-avatar" aria-hidden="true">{profile.nome.slice(0, 1).toUpperCase()}</div><h1>{profile.nome}</h1><p>{email}</p></section>
    <div className="profile-tabs" role="tablist" aria-label="Seções do perfil">{[['dados','Meus dados'],['seguranca','Segurança'],['sobre','Sobre']].map(([value,label]) => <button key={value} role="tab" aria-selected={tab === value} onClick={() => {setTab(value);setError('');setNotice('')}}>{label}</button>)}</div>
    {notice && <p className="profile-notice" role="status">{notice}</p>}{error && <p className="profile-error" role="alert">{error}</p>}
    {tab === 'dados' && <form className="profile-form" onSubmit={saveProfile}><h2>Meus dados</h2><label>Nome *<input name="nome" value={profile.nome} onChange={change} required /></label><label>Data nascimento (opcional)<input name="nascimento" type="date" value={profile.nascimento} onChange={change} /></label><label>Celular *<input name="celular" value={profile.celular} onChange={change} required /></label><fieldset><legend>Gênero (opcional)</legend>{['Feminino','Masculino','Outros'].map(value => <label className="radio-label" key={value}><input type="radio" name="genero" value={value} checked={profile.genero === value} onChange={change} />{value}</label>)}</fieldset><button className="profile-primary" type="submit">Salvar</button><button className="profile-secondary" type="button" onClick={() => sair()}>Excluir conta</button></form>}
    {tab === 'seguranca' && <form className="profile-form" onSubmit={saveSecurity}><h2>Segurança</h2><PasswordInput label="Senha atual *" value={senha.atual} onChange={event => setSenha({...senha, atual:event.target.value})} placeholder="Senha atual" autoComplete="current-password" /><PasswordInput label="Nova senha *" value={senha.nova} onChange={event => setSenha({...senha, nova:event.target.value})} placeholder="Nova senha" autoComplete="new-password" /><PasswordInput label="Confirmação da senha *" value={senha.confirmar} onChange={event => setSenha({...senha, confirmar:event.target.value})} placeholder="Confirmação de senha" autoComplete="new-password" /><div className="profile-access"><div><strong>Acessos</strong><span>{email}<small>E-mail e senha</small></span></div><button type="button" onClick={() => setEditingEmail(value => !value)}>{editingEmail ? 'Cancelar' : 'Alterar email'}</button>{editingEmail && <input type="email" value={email} onChange={event => setEmail(event.target.value)} aria-label="Novo e-mail" />}</div><button className="profile-primary" type="submit">Salvar</button></form>}
    {tab === 'sobre' && <section className="profile-about"><h2>Sobre</h2><p>Em breve informações do estabelecimento.</p></section>}
  </AppShell>
}
