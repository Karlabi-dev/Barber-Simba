import { Link } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import AppShell from '../components/AppShell'
import Header from '../components/Header'
import BarberCard from '../components/BarberCard'
import { loadProfessionals } from '../services/catalog'
import calendarIcon from '../assets/icons/calendario.png'
import clockIcon from '../assets/icons/relogio.png'
import hero from '../assets/icons/perfil.png'
import barbershop from '../assets/home/barbershop.png'
import promoBaboon from '../assets/home/promo-baboon.png'
import promoQueen from '../assets/home/promo-queen.png'
import promoLightHair from '../assets/home/promo-light-hair.png'
import { useAuth } from '../hooks/useAuth'
import { listBookings } from '../services/bookings'
import { readBookingHistory } from '../data/booking'
import { nextBooking, bookingDateLabel } from '../services/nextBooking'
import './Home.css'

const promotions = [
  { image: promoBaboon, brand: 'Baboon', title: 'Visual alinhado em poucos minutos', alt: 'Baboon Grooming: praticidade, visual alinhado e confiança para o dia todo.' },
  { image: promoQueen, brand: 'Queen Professional', title: 'Cuidado com o couro cabeludo', alt: 'Queen Visual Force Shampoo: 3x poder anticaspa, sem caspa, oleosidade ou coceira.' },
  { image: promoLightHair, brand: 'Light Hair', title: 'Sua rotina de cuidados completa', alt: 'Linha Light Hair Men Barber Shop com shampoo, condicionador e perfume.' },
]

export default function Home() {
  const useNeon = import.meta.env.VITE_USE_NEON === 'true'
  const { usuario, carregando } = useAuth()
  const firstName = usuario?.displayName?.trim().split(/\s+/)[0]
  const [bookingState, setBookingState] = useState({ uid: null, items: [], error: '' })
  const [bookingRetry, setBookingRetry] = useState(0)
  const [professionals, setProfessionals] = useState([])
  const [professionalsLoading, setProfessionalsLoading] = useState(true)
  const [professionalsError, setProfessionalsError] = useState('')
  const [professionalsRetry, setProfessionalsRetry] = useState(0)
  const [clock, setClock] = useState(() => new Date())
  const [promotion, setPromotion] = useState(0)
  const [paused, setPaused] = useState(false)
  const [interacting, setInteracting] = useState(false)
  const [expanded, setExpanded] = useState(null)
  const dialog = useRef(null)
  const running = !paused && !interacting && expanded === null
  const today = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' })
    .format(new Date()).replace(' de ', ' ').replace('.', '')
  const currentBookings = useNeon
    ? bookingState.uid === usuario?.uid ? bookingState.items : []
    : readBookingHistory()
  const upcoming = !useNeon || usuario ? nextBooking(currentBookings, clock) : null
  const loadingBooking = useNeon && (carregando || (usuario && bookingState.uid !== usuario.uid))
  const bookingError = bookingState.uid === usuario?.uid ? bookingState.error : ''
  const barber = upcoming && professionals.find(item => item.nome === upcoming.profissional)

  useEffect(() => {
    const controller = new AbortController()
    loadProfessionals(controller.signal)
      .then(items => {
        setProfessionals(items)
        setProfessionalsError('')
        setProfessionalsLoading(false)
      })
      .catch(cause => {
        if (cause.name !== 'AbortError') {
          setProfessionalsError(cause.message)
          setProfessionalsLoading(false)
        }
      })
    return () => controller.abort()
  }, [professionalsRetry])

  useEffect(() => {
    if (!useNeon || carregando || !usuario) return
    let active = true
    listBookings(usuario)
      .then(items => { if (active) setBookingState({ uid: usuario.uid, items, error: '' }) })
      .catch(cause => { if (active) setBookingState({ uid: usuario.uid, items: [], error: cause.message }) })
    return () => { active = false }
  }, [useNeon, carregando, usuario, bookingRetry])

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 60000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!running) return
    const timer = window.setTimeout(() => {
      setPromotion(value => (value + 1) % promotions.length)
    }, 5000)
    return () => window.clearTimeout(timer)
  }, [promotion, running])

  const changePromotion = direction => {
    setPromotion(value => (value + direction + promotions.length) % promotions.length)
  }

  const expandPromotion = index => {
    setExpanded(index)
    dialog.current.showModal()
  }

  return <AppShell className="home-screen"><Header />
    <section className="greeting"><h1>{firstName ? `Olá, ${firstName}` : 'Olá!'}</h1><p>Seja bem-vindo de volta à experiência SIMBA.</p></section>
    <Link className="hero-card" to="/servicos" aria-label="Agendar horário: escolher serviço" style={{ '--hero-image': `url(${barbershop})` }}>
      <div className="home-hero-copy">
        <h2>Agendar horário</h2>
        <p>Escolha seu serviço e garanta seu momento de autocuidado com nossos especialistas.</p>
        <div className="hero-options">
          <span><img src={calendarIcon} alt="" />Hoje, {today}</span>
          <span><img src={clockIcon} alt="" />Qualquer hora</span>
        </div>
        <strong>INICIAR AGENDAMENTO</strong>
      </div>
    </Link>

    <section className="home-promotions" aria-label="Promoções da barbearia" aria-roledescription="carrossel">
      <div className="home-section-heading">
        <div><span className="home-eyebrow">SELEÇÃO SIMBA</span><h2>Em destaque</h2></div>
        <button className="home-carousel-pause" type="button" aria-label={paused ? 'Retomar carrossel automático' : 'Pausar carrossel automático'} aria-pressed={paused} onClick={() => setPaused(value => !value)}>
          <span aria-hidden="true">{paused ? '▶' : 'Ⅱ'}</span>
        </button>
      </div>
      <div className="home-promo-window" onPointerEnter={event => { if (event.pointerType === 'mouse') setInteracting(true) }} onPointerLeave={() => setInteracting(false)} onFocus={() => setInteracting(true)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setInteracting(false) }}>
        <div className="home-promo-track" style={{ transform: `translateX(-${promotion * 100}%)` }}>
          {promotions.map((item, index) => <article className="home-promo-slide" key={item.image} aria-roledescription="slide" aria-label={`${index + 1} de ${promotions.length}: ${item.brand}`} aria-hidden={index !== promotion}>
            <button className="home-promo-art" type="button" tabIndex={index === promotion ? 0 : -1} aria-label={`Ampliar promoção ${item.brand}`} onClick={() => expandPromotion(index)}>
              <img src={item.image} alt={item.alt} />
              <span className="home-promo-expand" aria-hidden="true">⤢</span>
            </button>
            <div className="home-promo-caption"><div><span>{item.brand}</span><h3>{item.title}</h3></div><span className="home-promo-tag">Destaque</span></div>
          </article>)}
        </div>
      </div>
      <div className="home-carousel-controls">
        <button className="home-carousel-arrow" type="button" aria-label="Promoção anterior" onClick={() => changePromotion(-1)}>‹</button>
        <div className="home-carousel-dots" aria-label="Selecionar promoção">{promotions.map((item, index) => <button type="button" key={item.image} aria-label={`Ver promoção ${item.brand}`} aria-pressed={promotion === index} onClick={() => setPromotion(index)}><span /></button>)}</div>
        <span className="home-carousel-count" aria-live={running ? 'off' : 'polite'}>{String(promotion + 1).padStart(2, '0')} / 03</span>
        <button className="home-carousel-arrow" type="button" aria-label="Próxima promoção" onClick={() => changePromotion(1)}>›</button>
      </div>
    </section>

    <dialog ref={dialog} className="home-promo-dialog" onClose={() => setExpanded(null)} onClick={event => { if (event.target === event.currentTarget) dialog.current.close() }} aria-label="Promoção ampliada">
      <form method="dialog"><button type="submit" aria-label="Fechar promoção ampliada">×</button></form>
      {expanded !== null && <img src={promotions[expanded].image} alt={promotions[expanded].alt} />}
    </dialog>
    <section className="section-block"><h2>Próximo Agendamento</h2>
      {upcoming ? <article className="appointment-card">
        <div className="appointment-person"><img className={!barber || barber.foto === hero ? 'appointment-placeholder' : ''} src={barber?.foto || hero} alt="" /><div><strong>{upcoming.profissional}</strong><span>{upcoming.servico}</span></div><em>Confirmado</em></div>
        <div className="appointment-time"><span><img src={calendarIcon} alt="" /> <time dateTime={upcoming.data}>{bookingDateLabel(upcoming.data, clock)}</time></span><span><img src={clockIcon} alt="" /> <time dateTime={`${upcoming.data}T${upcoming.horario}`}>{upcoming.horario}</time></span></div>
      </article> : <div className="appointment-card appointment-empty">
        {loadingBooking ? <p role="status">Carregando seu próximo agendamento...</p>
          : bookingError ? <><p role="alert">Não foi possível carregar seus agendamentos.</p><button type="button" onClick={() => setBookingRetry(value => value + 1)}>Tentar novamente</button></>
            : useNeon && !usuario ? <><p>Entre na sua conta para ver seu próximo agendamento.</p><Link to="/login">Entrar</Link></>
              : <><p>Você ainda não tem um agendamento futuro.</p><Link to="/servicos">Agendar horário</Link></>}
      </div>}
    </section>
    <section className="section-block professionals-preview"><div className="section-title"><h2>Profissionais</h2><Link to="/profissionais">Ver todos</Link></div>
      {professionalsLoading && <p className="home-professionals-state" role="status">Carregando profissionais...</p>}
      {!professionalsLoading && professionalsError && <div className="home-professionals-state" role="alert">{professionalsError} <button type="button" onClick={() => { setProfessionalsLoading(true); setProfessionalsRetry(value => value + 1) }}>Tentar novamente</button></div>}
      {!professionalsLoading && !professionalsError && !professionals.length && <p className="home-professionals-state" role="status">Nenhum profissional cadastrado no momento.</p>}
      {!professionalsLoading && !professionalsError && professionals.length > 0 && <div className="barber-track">{professionals.map(person => <BarberCard key={person.id} {...person} />)}</div>}
    </section>
  </AppShell>
}
