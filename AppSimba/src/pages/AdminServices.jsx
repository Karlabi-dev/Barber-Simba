import { useEffect, useState } from 'react'
import AdminPage from '../components/AdminPage'
import { useAuth } from '../hooks/useAuth'
import { loadAdminServices, saveAdminService } from '../services/admin'
import { decimalPrice, formatPrice, slugFromName } from '../services/adminForm'
import './AdminCatalog.css'

const blank = { nome: '', slug: '', descricao: '', categoria: 'Cabelo', preco: '', duracao: '30', iconKey: 'tesoura', ativo: true }

export default function AdminServices() {
  const { usuario } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState('')
  const [formError, setFormError] = useState('')
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [changing, setChanging] = useState(null)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    loadAdminServices(usuario, controller.signal)
      .then(rows => {
        if (!Array.isArray(rows)) throw new Error('Resposta inválida dos serviços.')
        setItems(rows)
        setListError('')
      })
      .catch(cause => { if (!controller.signal.aborted) setListError(cause.message) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [usuario, retry])

  function begin(item = null) {
    setEditing(item?.id || null)
    setForm(item ? { ...item, duracao: String(item.duracao) } : { ...blank })
    setFormError('')
  }

  function changeName(value) {
    setForm(previous => ({ ...previous, nome: value,
      slug: !editing && previous.slug === slugFromName(previous.nome) ? slugFromName(value) : previous.slug }))
  }

  async function submit(event) {
    event.preventDefault()
    if (saving) return
    const preco = decimalPrice(form.preco)
    const duracao = Number(form.duracao)
    if (!preco || !Number.isInteger(duracao) || duracao < 1 || duracao > 1440) {
      setFormError('Confira o preço e a duração do serviço.')
      return
    }
    const payload = { nome: form.nome.trim(), descricao: form.descricao.trim(), categoria: form.categoria.trim(),
      preco, duracao, iconKey: form.iconKey, ativo: form.ativo,
      ...(!editing ? { slug: form.slug.trim() } : {}) }
    setSaving(true)
    setFormError('')
    try {
      const saved = await saveAdminService(usuario, payload, editing)
      setItems(current => [...current.filter(item => item.id !== saved.id), saved].sort((a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome)))
      setForm(null)
      setEditing(null)
    } catch (cause) { setFormError(cause.message) }
    finally { setSaving(false) }
  }

  async function toggle(item) {
    if (changing) return
    setChanging(item.id)
    setListError('')
    try {
      const saved = await saveAdminService(usuario, { ativo: !item.ativo }, item.id)
      setItems(current => current.map(row => row.id === saved.id ? saved : row))
    } catch (cause) { setListError(cause.message) }
    finally { setChanging(null) }
  }

  return <AdminPage title="SERVIÇOS" onAdd={() => begin()}>
    <p className="admin-intro">Catálogo de serviços da barbearia</p>
    {loading && <p className="admin-feedback" role="status">Carregando serviços...</p>}
    {listError && <p className="admin-error" role="alert">{listError} <button type="button" onClick={() => { setLoading(true); setRetry(value => value + 1) }}>Tentar novamente</button></p>}
    {!loading && !listError && items.length === 0 && <p className="admin-feedback">Nenhum serviço cadastrado.</p>}
    <div className="admin-catalog-list">{items.map(item => <article key={item.id} className="admin-catalog-card">
      <div className="admin-catalog-copy"><strong>{item.nome}</strong><span>{item.duracao} min · {formatPrice(item.preco)}</span><small>{item.categoria} · {item.ativo ? 'Ativo' : 'Inativo'}</small></div>
      <div className="admin-catalog-actions"><button type="button" onClick={() => begin(item)} aria-label={`Editar ${item.nome}`}>Editar</button><button type="button" disabled={changing === item.id} onClick={() => toggle(item)}>{item.ativo ? 'Desativar' : 'Ativar'}</button></div>
    </article>)}</div>

    {form && <section className="admin-form-panel" aria-labelledby="admin-service-form-title">
      <div className="admin-form-heading"><h2 id="admin-service-form-title">{editing ? 'Editar serviço' : 'Cadastrar novo serviço'}</h2><button type="button" aria-label="Fechar formulário" onClick={() => setForm(null)}>×</button></div>
      <form onSubmit={submit} className="admin-form">
        <label>Nome do serviço<input value={form.nome} onChange={event => changeName(event.target.value)} maxLength="120" required /></label>
        {!editing && <label>Identificador<input value={form.slug} onChange={event => setForm({ ...form, slug: event.target.value.toLowerCase() })} pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength="100" required /><small>Usado no agendamento; letras minúsculas, números e hífens.</small></label>}
        <label>Categoria<input value={form.categoria} onChange={event => setForm({ ...form, categoria: event.target.value })} maxLength="120" required /></label>
        <label>Descrição<textarea value={form.descricao} onChange={event => setForm({ ...form, descricao: event.target.value })} maxLength="500" rows="2" /></label>
        <div className="admin-form-row"><label>Duração (min)<input type="number" min="1" max="1440" value={form.duracao} onChange={event => setForm({ ...form, duracao: event.target.value })} required /></label><label>Preço (R$)<input inputMode="decimal" value={form.preco} onChange={event => setForm({ ...form, preco: event.target.value })} placeholder="45,00" required /></label></div>
        <label>Ícone<select value={form.iconKey} onChange={event => setForm({ ...form, iconKey: event.target.value })}><option value="tesoura">Tesoura</option><option value="barba">Barba</option><option value="narvalha">Navalha</option><option value="brilho">Brilho</option></select></label>
        <label className="admin-check"><input type="checkbox" checked={form.ativo} onChange={event => setForm({ ...form, ativo: event.target.checked })} /> Disponível para agendamento</label>
        {formError && <p className="admin-error" role="alert">{formError}</p>}
        <button className="admin-save" type="submit" disabled={saving}>{saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Salvar serviço'}</button>
      </form>
    </section>}
  </AdminPage>
}
