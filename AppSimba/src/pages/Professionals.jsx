import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AppShell from '../components/AppShell'
import Header from '../components/Header'
import { barbeiros } from '../data/barbeiros'
import { readBookingHistory, saveBooking } from '../data/booking'
import { filterProfessionals, readReviews, saveReview } from '../data/reviews'
import './Professionals.css'

export default function Professionals() {
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('all')
  const [filterOpen, setFilterOpen] = useState(false)
  const [service, setService] = useState('')
  const [day, setDay] = useState('')
  const [rating, setRating] = useState('')
  const [historyFilter, setHistoryFilter] = useState('pending')
  const [reviews, setReviews] = useState(readReviews)
  const [selected, setSelected] = useState(null)
  const [stars, setStars] = useState(0)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const dialog = useRef(null)
  const navigate = useNavigate()
  const filtered = filterProfessionals(barbeiros, {search, service, day, rating})
  const history = readBookingHistory().filter(item => item.status === 'concluido' && item.profissional.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()) && (historyFilter === 'rated' ? !!reviews[item.id] : !reviews[item.id]))
  function openReview(item) { setSelected(item); setStars(0); setError(''); dialog.current.showModal() }
  function submit(event) {
    event.preventDefault()
    try { setReviews(saveReview(selected.id, stars)); dialog.current.close(); setMessage('Avaliação enviada. Obrigado!') } catch (err) { setError(err.message) }
  }
  function rebook(item) {
    saveBooking({profissional:item.profissional, servico:item.servico, data:'', horario:'', observacoes:''})
    navigate(`/agendamento?${new URLSearchParams({profissional:item.profissional, servico:item.servico})}`)
  }
  const person = selected && barbeiros.find(item => item.nome === selected.profissional)
  return <AppShell className="professionals-screen"><Header title="PROFISSIONAIS" compact />
    <label className="search"><span aria-hidden="true">⌕</span><input value={search} onChange={event => setSearch(event.target.value)} aria-label="Buscar profissionais" placeholder="Buscar profissionais" /></label>
    <div className="professionals-tabs" role="group" aria-label="Seção de profissionais"><button aria-pressed={tab === 'all'} onClick={() => setTab('all')}>Todos</button><button aria-pressed={tab === 'history'} onClick={() => setTab('history')}>Histórico de avaliações</button></div>
    {tab === 'all' ? <>
      <div className="professionals-tabs"><button aria-expanded={filterOpen} aria-controls="professional-filters" onClick={() => setFilterOpen(!filterOpen)}>▽ Filtrar{[service,day,rating].filter(Boolean).length ? ` (${[service,day,rating].filter(Boolean).length})` : ''}</button></div>
      {filterOpen && <div id="professional-filters" className="professional-filters">
        <label>Serviço / especialidade<select value={service} onChange={event => setService(event.target.value)}><option value="">Todos</option>{[...new Set(barbeiros.map(item => item.especialidade))].map(value => <option key={value}>{value}</option>)}</select></label>
        <label>Dia disponível<select value={day} onChange={event => setDay(event.target.value)}><option value="">Todos os dias</option>{['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'].map(value => <option key={value}>{value}</option>)}</select></label>
        <label>Nota mínima<select value={rating} onChange={event => setRating(event.target.value)}><option value="">Todas as notas</option>{[3,4,4.5,4.8,5].map(value => <option key={value} value={value}>{value.toLocaleString('pt-BR')} estrelas</option>)}</select></label>
        <button onClick={() => {setService('');setDay('');setRating('')}}>Limpar filtros</button>
      </div>}
      <section className="professionals-results">{filtered.map(item => <article className="professional-row" key={item.nome}><img src={item.foto} alt="" /><div className="professional-info"><h2>{item.nome} <span className="professional-rating">★ {item.avaliacao}</span></h2><p>{item.especialidade}</p><small>{item.dias.split('/').join(', ')}</small></div><Link className="professional-action" to={`/agendamento?${new URLSearchParams({profissional:item.nome})}`}>AGENDAR</Link></article>)}{!filtered.length && <p className="professionals-empty" role="status">Nenhum profissional encontrado com esses filtros.</p>}</section>
    </> : <>
      <div className="professionals-tabs" role="group" aria-label="Filtrar avaliações"><button aria-pressed={historyFilter === 'pending'} onClick={() => setHistoryFilter('pending')}>Pendentes</button><button aria-pressed={historyFilter === 'rated'} onClick={() => setHistoryFilter('rated')}>Avaliados</button></div>
      <section className="professionals-results">{history.map(item => { const barber = barbeiros.find(value => value.nome === item.profissional); return <article className="professional-row" key={item.id}>{barber && <img src={barber.foto} alt="" />}<div className="professional-info"><h2>{item.profissional} <span className="professional-completed">Concluído</span></h2><p>{item.servico}</p><small>{new Date(`${item.data}T12:00:00`).toLocaleDateString('pt-BR')} · {item.horario}</small></div><div className="professional-actions">{reviews[item.id] ? <span className="professional-rated">AVALIADO · {reviews[item.id].stars} ★</span> : <button className="professional-action review-action" onClick={() => openReview(item)}>AVALIAR</button>}<button className="professional-action" onClick={() => rebook(item)}>REAGENDAR</button></div></article> })}{!history.length && <p className="professionals-empty">{historyFilter === 'pending' ? 'Nenhum atendimento concluído pendente de avaliação.' : 'Nenhum atendimento avaliado.'}</p>}</section>
    </>}
    {message && <p role="status" className="review-feedback">{message}</p>}
    <dialog ref={dialog} className="review-sheet" aria-labelledby="review-title"><form onSubmit={submit}><button type="button" className="review-close" aria-label="Fechar avaliação" onClick={() => dialog.current.close()}>×</button>{person && <img src={person.foto} alt="" />}<h2 id="review-title">Avalie o profissional</h2><p>{selected?.profissional} · {selected?.servico}</p><div className="review-stars" role="group" aria-label="Nota de 1 a 5 estrelas">{[1,2,3,4,5].map(value => <button type="button" key={value} aria-label={`${value} ${value === 1 ? 'estrela' : 'estrelas'}`} aria-pressed={stars === value} onClick={() => setStars(value)}>{value <= stars ? '★' : '☆'}</button>)}</div>{error && <p role="alert">{error}</p>}<button className="review-submit" disabled={!stars}>ENVIAR AVALIAÇÃO</button></form></dialog>
  </AppShell>
}
