import { Link } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import AppShell from '../components/AppShell'
import Header from '../components/Header'
import BarberCard from '../components/BarberCard'
import { barbeiros } from '../data/barbeiros'
import calendarIcon from '../assets/icons/calendario.png'
import clockIcon from '../assets/icons/relogio.png'
import hero from '../assets/icons/perfil.png'
import barbershop from '../assets/home/barbershop.png'
import promoBaboon from '../assets/home/promo-baboon.png'
import promoQueen from '../assets/home/promo-queen.png'
import promoLightHair from '../assets/home/promo-light-hair.png'
import './Home.css'

const promotions = [
  { image: promoBaboon, brand: 'Baboon', title: 'Visual alinhado em poucos minutos', alt: 'Baboon Grooming: praticidade, visual alinhado e confiança para o dia todo.' },
  { image: promoQueen, brand: 'Queen Professional', title: 'Cuidado com o couro cabeludo', alt: 'Queen Visual Force Shampoo: 3x poder anticaspa, sem caspa, oleosidade ou coceira.' },
  { image: promoLightHair, brand: 'Light Hair', title: 'Sua rotina de cuidados completa', alt: 'Linha Light Hair Men Barber Shop com shampoo, condicionador e perfume.' },
]

export default function Home() {
  const [promotion, setPromotion] = useState(0)
  const [paused, setPaused] = useState(false)
  const [interacting, setInteracting] = useState(false)
  const [expanded, setExpanded] = useState(null)
  const dialog = useRef(null)
  const running = !paused && !interacting && expanded === null
  const today = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' })
    .format(new Date()).replace(' de ', ' ').replace('.', '')

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
    <section className="greeting"><h1>Olá, Guilherme</h1><p>Seja bem-vindo de volta à experiência SIMBA.</p></section>
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
    <section className="section-block"><h2>Próximo Agendamento</h2><article className="appointment-card">
      <div className="appointment-person"><img src={hero} alt="Thiago Silva" /><div><strong>Thiago Silva</strong><span>Corte Masculino & Barba</span></div><em>Confirmado</em></div>
      <div className="appointment-time"><span><img src={calendarIcon} alt="" /> Amanhã, 19 Out</span><span><img src={clockIcon} alt="" /> 14:30 - 15:30</span></div>
    </article></section>
    <section className="section-block professionals-preview"><div className="section-title"><h2>Profissionais</h2><Link to="/profissionais">Ver todos</Link></div><div className="barber-track">{[barbeiros[3], ...barbeiros.slice(0, 2)].map((barber) => <BarberCard key={barber.nome} {...barber} />)}</div></section>
  </AppShell>
}
