import { Link } from 'react-router-dom'
import AppShell from '../components/AppShell'
import Header from '../components/Header'
import BarberCard from '../components/BarberCard'
import { barbeiros } from '../data/barbeiros'
import calendarIcon from '../assets/icons/calendario.png'
import clockIcon from '../assets/icons/relogio.png'
import hero from '../assets/icons/perfil.png'

export default function Home() {
  return <AppShell><Header />
    <section className="greeting"><h1>Olá, Guilherme</h1><p>Seja bem-vindo de volta à experiência SIMBA.</p></section>
    <Link className="hero-card" to="/servicos"><div><h2>Agendar horário</h2><p>Escolha seu serviço e garanta seu momento de autocuidado com nossos especialistas.</p><div className="hero-options"><span>Hoje</span><span>Qualquer hora</span></div><strong>INICIAR AGENDAMENTO</strong></div></Link>
    <section className="section-block"><h2>Próximo Agendamento</h2><article className="appointment-card">
      <div className="appointment-person"><img src={hero} alt="Thiago Silva" /><div><strong>Thiago Silva</strong><span>Corte Masculino & Barba</span></div><em>Confirmado</em></div>
      <div className="appointment-time"><span><img src={calendarIcon} alt="" /> Amanhã, 19 Out</span><span><img src={clockIcon} alt="" /> 14:30 - 15:30</span></div>
    </article></section>
    <section className="section-block professionals-preview"><div className="section-title"><h2>Profissionais</h2><Link to="/profissionais">Ver todos</Link></div><div className="barber-track">{[barbeiros[3], ...barbeiros.slice(0, 2)].map((barber) => <BarberCard key={barber.nome} {...barber} />)}</div></section>
  </AppShell>
}
