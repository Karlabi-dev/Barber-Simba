import { Link } from 'react-router-dom'
import AppShell from '../components/AppShell'
import Header from '../components/Header'
import BarberCard from '../components/BarberCard'
import { barbeiros } from '../data/barbeiros'
import calendarIcon from '../assets/icons/calendario.png'
import clockIcon from '../assets/icons/relogio.png'
import hero from '../assets/hero.png'

export default function Home() {
  return <AppShell><Header />
    <section className="greeting"><h1>Olá, Guilherme</h1><p>Seja bem-vindo de volta à experiência SIMBA.</p></section>
    <Link className="hero-card" to="/servicos"><div><span>NOVA EXPERIÊNCIA</span><h2>Seu estilo.<br />Nossa assinatura.</h2><p>Agende seu próximo horário.</p><strong>AGENDAR AGORA →</strong></div><img src={hero} alt="Barbeiro Simba" /></Link>
    <section className="section-block"><h2>Próximo Agendamento</h2><article className="appointment-card">
      <div className="appointment-person"><img src={hero} alt="Thiago Silva" /><div><strong>Thiago Silva</strong><span>Corte Masculino & Barba</span></div><em>Confirmado</em></div>
      <div className="appointment-time"><span><img src={calendarIcon} alt="" /> Amanhã, 19 Out</span><span><img src={clockIcon} alt="" /> 14:30 - 15:30</span></div>
    </article></section>
    <section className="section-block professionals-preview"><div className="section-title"><h2>Profissionais</h2><Link to="/profissionais">Ver todos</Link></div><div className="barber-track">{barbeiros.slice(0, 3).map((barber) => <BarberCard key={barber.nome} {...barber} />)}</div></section>
  </AppShell>
}
