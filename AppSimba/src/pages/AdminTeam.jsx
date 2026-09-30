import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom'
import AdminPage from '../components/AdminPage'
import { useAuth } from '../hooks/useAuth'
import { loadAdminHours, loadAdminProfessionals, saveAdminProfessional, saveAdminHours, deleteAdminHours } from '../services/admin'
import { slugFromName } from '../services/adminForm'
import profileIcon from '../assets/icons/perfil.png'
import allander from '../assets/allander.png'
import './AdminCatalog.css'

const days = [['1', 'Seg'], ['2', 'Ter'], ['3', 'Qua'], ['4', 'Qui'], ['5', 'Sex'], ['6', 'Sáb'], ['7', 'Dom']]
const blank = { nome: '', slug: '', especialidade: '', ativo: true }
const emptyWeek = () => Object.fromEntries(days.map(([day]) => [day, { enabled: false, abertura: '09:00', fechamento: '19:00' }]))
const minutes = time => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5))

export function AdminTeam() {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [changing, setChanging] = useState(null)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    loadAdminProfessionals(usuario, controller.signal)
      .then(rows => {
        if (!Array.isArray(rows)) throw new Error('Resposta inválida da equipe.')
        setItems(rows)
        setError('')
      })
      .catch(cause => { if (!controller.signal.aborted) setError(cause.message) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [usuario, retry])

  async function toggle(item) {
    if (changing) return
    setChanging(item.id)
    setError('')
    try {
      const saved = await saveAdminProfessional(usuario, { ativo: !item.ativo }, item.id)
      setItems(current => current.map(row => row.id === saved.id ? saved : row))
    } catch (cause) { setError(cause.message) }
    finally { setChanging(null) }
  }

  return <AdminPage title="EQUIPE" onAdd={() => navigate('/admin/equipe/novo')}>
    <p className="admin-intro">Profissionais e horários de atendimento</p>
    {loading && <p className="admin-feedback" role="status">Carregando equipe...</p>}
    {error && <p className="admin-error" role="alert">{error} <button type="button" onClick={() => { setLoading(true); setRetry(value => value + 1) }}>Tentar novamente</button></p>}
    {!loading && !error && !items.length && <p className="admin-feedback">Nenhum profissional cadastrado.</p>}
    <div className="admin-catalog-list">{items.map(item => <article key={item.id} className="admin-catalog-card">
      <img className="admin-team-avatar" src={item.imageKey === 'allander' ? allander : profileIcon} alt="" />
      <div className="admin-catalog-copy"><strong>{item.nome} <span className={item.ativo ? 'admin-active' : 'admin-inactive'}>{item.ativo ? 'Ativo' : 'Inativo'}</span></strong><span>{item.especialidade || 'Especialidade não informada'}</span><small>{item.dias ? item.dias.split('/').join(', ') : 'Sem horários cadastrados'}</small></div>
      <div className="admin-catalog-actions"><Link to={`/admin/equipe/${item.id}`} aria-label={`Editar ${item.nome}`}>Editar</Link><button type="button" disabled={changing === item.id} onClick={() => toggle(item)}>{item.ativo ? 'Desativar' : 'Ativar'}</button></div>
    </article>)}</div>
  </AdminPage>
}

export function AdminProfessionalForm() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const creating = id === 'novo'
  const [form, setForm] = useState(creating ? { ...blank } : null)
  const [week, setWeek] = useState(emptyWeek)
  const [originalDays, setOriginalDays] = useState([])
  const [loading, setLoading] = useState(!creating)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(location.search.includes('horarios=pendentes') ? 'Profissional salvo, mas alguns horários não foram atualizados. Confira e salve novamente.' : '')

  useEffect(() => {
    if (creating) return
    const controller = new AbortController()
    Promise.all([loadAdminProfessionals(usuario, controller.signal), loadAdminHours(usuario, id, controller.signal)])
      .then(([people, hours]) => {
        const person = people.find(item => item.id === id)
        if (!person) throw new Error('Profissional não encontrado.')
        setForm(person)
        setOriginalDays(hours.map(item => String(item.dia)))
        setWeek({ ...emptyWeek(), ...Object.fromEntries(hours.map(item => [String(item.dia), {
          enabled: true, abertura: item.abertura, fechamento: item.fechamento,
        }])) })
      })
      .catch(cause => { if (!controller.signal.aborted) setError(cause.message) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [creating, id, usuario])

  function updateDay(day, patch) {
    setWeek(current => ({ ...current, [day]: { ...current[day], ...patch } }))
  }

  function changeName(value) {
    setForm(previous => ({ ...previous, nome: value,
      slug: creating && previous.slug === slugFromName(previous.nome) ? slugFromName(value) : previous.slug }))
  }

  async function submit(event) {
    event.preventDefault()
    if (saving) return
    if (days.some(([day]) => week[day].enabled && minutes(week[day].abertura) >= minutes(week[day].fechamento))) {
      setError('A abertura precisa ser anterior ao fechamento em cada dia selecionado.')
      return
    }
    setSaving(true)
    setError('')
    const payload = { nome: form.nome.trim(), especialidade: form.especialidade.trim(), ativo: form.ativo,
      ...(creating ? { slug: form.slug.trim() } : {}) }
    try {
      const saved = await saveAdminProfessional(usuario, payload, creating ? null : id)
      const updates = days.flatMap(([day]) => week[day].enabled
        ? [saveAdminHours(usuario, saved.id, day, { abertura: week[day].abertura, fechamento: week[day].fechamento })]
        : originalDays.includes(day) ? [deleteAdminHours(usuario, saved.id, day)] : [])
      const results = await Promise.allSettled(updates)
      if (results.some(result => result.status === 'rejected')) {
        if (creating) navigate(`/admin/equipe/${saved.id}?horarios=pendentes`, { replace: true })
        else {
          setError('Profissional salvo, mas alguns horários não foram atualizados. Confira e salve novamente.')
          const actual = await loadAdminHours(usuario, saved.id)
          setOriginalDays(actual.map(item => String(item.dia)))
        }
      } else navigate('/admin/equipe')
    } catch (cause) { setError(cause.message) }
    finally { setSaving(false) }
  }

  return <AdminPage title={creating ? 'NOVO PROFISSIONAL' : 'EDITAR PROFISSIONAL'}>
    <p className="admin-intro">{creating ? 'Cadastre um profissional e configure os dias em que atende.' : 'Atualize os dados e os horários deste profissional.'}</p>
    {loading && <p className="admin-feedback" role="status">Carregando profissional...</p>}
    {!loading && !form && <p className="admin-error" role="alert">{error} <Link to="/admin/equipe">Voltar à equipe</Link></p>}
    {form && <form className="admin-form admin-professional-form" onSubmit={submit}>
      <div className="admin-profile-placeholder"><img src={profileIcon} alt="" /><small>Foto padrão</small></div>
      <label>Nome completo<input value={form.nome} onChange={event => changeName(event.target.value)} maxLength="120" required /></label>
      {creating && <label>Identificador<input value={form.slug} onChange={event => setForm({ ...form, slug: event.target.value.toLowerCase() })} pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength="100" required /><small>Usado na agenda; letras minúsculas, números e hífens.</small></label>}
      <label>Especialidades<input value={form.especialidade} onChange={event => setForm({ ...form, especialidade: event.target.value })} maxLength="200" placeholder="Corte, barba, coloração..." /></label>
      <fieldset className="admin-week"><legend>Dias e horários de atendimento</legend>{days.map(([day, label]) => <div className="admin-day" key={day}>
        <label className="admin-check"><input type="checkbox" checked={week[day].enabled} onChange={event => updateDay(day, { enabled: event.target.checked })} /> {label}</label>
        {week[day].enabled && <div className="admin-form-row"><label>Início<input aria-label={`${label}: início`} type="time" value={week[day].abertura} onChange={event => updateDay(day, { abertura: event.target.value })} required /></label><label>Fim<input aria-label={`${label}: fim`} type="time" value={week[day].fechamento} onChange={event => updateDay(day, { fechamento: event.target.value })} required /></label></div>}
      </div>)}</fieldset>
      <label className="admin-check"><input type="checkbox" checked={form.ativo} onChange={event => setForm({ ...form, ativo: event.target.checked })} /> Disponível para agendamento</label>
      <p className="admin-form-note">Este cadastro cria o perfil da equipe. O acesso do profissional ao app será configurado separadamente.</p>
      {error && <p className="admin-error" role="alert">{error}</p>}
      <button className="admin-save" type="submit" disabled={saving}>{saving ? 'Salvando...' : creating ? 'Cadastrar profissional' : 'Salvar alterações'}</button>
    </form>}
  </AdminPage>
}
