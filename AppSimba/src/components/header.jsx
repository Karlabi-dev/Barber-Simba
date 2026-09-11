function Header({ nome, foto }) {
  return (
    <header className="header">
        <img>
        className="barber-avatar"
        src={foto}
        alt={nome}
        </img>

        <h2>♕ SIMBA</h2>

        <h1>Olá, {nome}</h1>
        <p>Seja bem-vindo de volta à experiência SIMBA.</p>
    </header> 
  );
}

export default Header;
