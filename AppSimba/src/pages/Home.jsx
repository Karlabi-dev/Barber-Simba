import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
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

const promotions = [
  { image: promoBaboon, title: 'Seu cabelo de forma em poucas horas?', text: 'Tenha praticidade e visual alinhado no dia a dia.', action: 'CONFERIR AGORA' },
  { image: promoQueen, title: '3x poder anticaspa', text: 'Cuide do couro cabeludo e mantenha seu visual impecável.', action: 'VER PRODUTO' },
  { image: promoLightHair, title: 'Rotina completa para o seu cabelo', text: 'Shampoo, condicionador e perfume para usar todos os dias.', action: 'CONHECER' },
]

export default function Home() {
  const [promotion, setPromotion] = useState(0)
  useEffect(() => { const timer = window.setInterval(() => setPromotion(value => (value + 1) % promotions.length), 5000); return () => window.clearInterval(timer) }, [])
  return <AppShell className="home-screen"><Header />
    <section className="greeting"><h1>Olá, Guilherme</h1><p>Seja bem-vindo de volta à experiência SIMBA.</p></section>
    <Link className="hero-card" to="/servicos" style={{'--hero-image':`url(${barbershop})`}}><div><h2>Agendar horário</h2><p>Escolha seu serviço e garanta seu momento de autocuidado com nossos especialistas.</p><div className="hero-options"><span>Hoje</span><span>Qualquer hora</span></div><strong>INICIAR AGENDAMENTO</strong></div></Link>
    <section className="promotion-carousel" aria-label="Promoções da barbearia"><article className="promotion-card"><img src={promotions[promotion].image} alt="" /><div className="promotion-copy"><strong>Promoção</strong><h2>{promotions[promotion].title}</h2><p>{promotions[promotion].text}</p><button type="button">{promotions[promotion].action}</button></div></article><div className="promotion-dots" aria-label="Selecionar promoção">{promotions.map((item, index) => <button type="button" key={item.image} aria-label={`Promoção ${index + 1}`} aria-pressed={promotion === index} onClick={() => setPromotion(index)} />)}</div></section>
    <section className="section-block"><h2>Próximo Agendamento</h2><article className="appointment-card">
      <div className="appointment-person"><img src={hero} alt="Thiago Silva" /><div><strong>Thiago Silva</strong><span>Corte Masculino & Barba</span></div><em>Confirmado</em></div>
      <div className="appointment-time"><span><img src={calendarIcon} alt="" /> Amanhã, 19 Out</span><span><img src={clockIcon} alt="" /> 14:30 - 15:30</span></div>
    </article></section>
    <section className="section-block professionals-preview"><div className="section-title"><h2>Profissionais</h2><Link to="/profissionais">Ver todos</Link></div><div className="barber-track">{[barbeiros[3], ...barbeiros.slice(0, 2)].map((barber) => <BarberCard key={barber.nome} {...barber} />)}</div></section>
  </AppShell>
}
