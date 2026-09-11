function Navbar({ IconHome, IconAgenda, IconServ, IconPerfil }) {
  return (
    <nav className="navbar">
      <a href="/"><img src={IconHome} alt="Home" /><span>Home</span></a>
      <a href="/"><img src={IconAgenda} alt="Agendas" /><span>Agendas</span></a>
      <a href="/"><img src={IconServ} alt="Serviços" /><span>Serviços</span></a>
      <a href="/"><img src={IconPerfil} alt="Perfil" /><span>Perfil</span></a>
    </nav>
  );
}

export default Navbar;

