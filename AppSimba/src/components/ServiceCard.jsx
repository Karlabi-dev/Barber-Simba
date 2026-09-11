function ServiceCard({nome,descricao,preco,duracao,IconTesoura,IconRelogio,
}) {
  return (
    <div className="service-card">
      <div className="service-icon"><img src={IconTesoura} alt="Serviço" />
      </div>

      <div><h3>{nome}</h3><p>{descricao}</p><small><img src={IconRelogio} alt="" />{duracao} min</small></div>

      <div className="service-info">
        <strong>R$ {preco}</strong>
        <button>Agendar</button>
      </div>
    </div>
  );
}

export default ServiceCard;