import { Link } from 'react-router-dom'

export default function BarberCard({ nome, especialidade, avaliacao, foto, dias, list = false }) {
  if (list) return <article className="professional-row">
    <span className="availability-dot" /><img className="professional-avatar" src={foto} alt={`Foto de ${nome}`} />
    <div className="professional-copy"><div><h3>{nome}</h3><span>{dias}</span></div><p>Profissional em {especialidade}</p></div>
    <Link className="small-button" to="/agendamento">Mais</Link>
  </article>

  return <article className="barber-card">
    <img className="barber-avatar" src={foto} alt={`Foto de ${nome}`} /><h3>{nome}</h3>
    <p>{especialidade}</p><span className="rating">★ {avaliacao}</span>
  </article>
}
