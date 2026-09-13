import { Link } from 'react-router-dom'
import clockIcon from '../assets/icons/relogio.png'

export default function ServiceCard({ nome, descricao, preco, duracao, icon }) {
  return <article className="service-card">
    <div className="service-icon"><img src={icon} alt="" /></div>
    <div className="service-copy"><h3>{nome}</h3><p>{descricao}</p><span><img src={clockIcon} alt="" /> {duracao} min</span></div>
    <div className="service-action"><strong>R$ {preco}</strong><Link to={`/agendamento?servico=${encodeURIComponent(nome)}`}>Agendar</Link></div>
  </article>
}
