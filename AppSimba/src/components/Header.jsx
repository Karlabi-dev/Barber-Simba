import { Link } from 'react-router-dom'
import profileIcon from '../assets/icons/perfil.png'

export default function Header({ title, backTo, compact = false }) {
  if (compact) return <header className="page-header">
    <Link className="icon-button" to={backTo || '/home'} aria-label="Voltar">←</Link>
    <h1>{title}</h1><span className="header-spacer" />
  </header>

  return <header className="brand-header">
    <Link className="brand" to="/home">SIMBA</Link>
    <Link className="profile-button" to="/perfil" aria-label="Abrir perfil"><img src={profileIcon} alt="" /></Link>
  </header>
}
