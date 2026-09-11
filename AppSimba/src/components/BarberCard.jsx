function BarberCard({ nome, especialidade, avaliacao, foto }) {
  return (
    <div className="barber-card">
      <img
        className="barber-avatar"
        src={foto}
        alt={nome}
      />

      <h3>{nome}</h3>
      <p>{especialidade}</p>
      <span>⭐ {avaliacao}</span>
    </div>
  );
}

export default BarberCard;
