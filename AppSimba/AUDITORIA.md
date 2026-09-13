# Auditoria Barber Simba

Referência: captura das sete telas fornecida pelo usuário; prioridade para a instrução de manter profissionais no tema escuro.

## Corrigido
- Profissionais: removida a classe de tema claro; mantidos fundo escuro, cartões e ações douradas.
- Tipografia: removido Playfair Display, não presente na referência.
- Navegação: perfil não direciona mais para profissionais; página provisória identificada como tal.
- Home: textos e botão do cartão de agendamento aproximados da referência; Allander entre os destaques.
- Catálogo: filtros Todos/Cabelo/Barba/Combos e estado vazio.
- Formulário: seleção de serviço e profissional chega à revisão; data, hora e observações são preservadas ao editar.
- Allander disponível na seleção do formulário, com a fotografia enviada.
- Revisão: não anuncia envio de notificações inexistentes; persistência apenas na sessão do navegador.
- Imagem decorativa do template Vite removida das fotos de pessoas.
- Arquivo duplicado button.jsx removido, mantendo Button.jsx (evita conflito de nomes no Windows).
- Navegação inferior em posição sticky e campos ajustados para telas estreitas.

## Ainda pendente — não é fidelidade total
- Fotografias dos demais profissionais, avatar do usuário, banner, coroa e ícones originais exportados.
- Mapa visual original: substituído por link explícito de endereço, sem inventar mapa.
- A captura reduzida não permite obter com precisão absoluta cores, fonte e medidas. Valores visuais são aproximações da captura.
- Perfil não foi desenhado nas sete telas entregues; a página provisória apenas esclarece essa ausência.
- Backend, disponibilidade real de agenda, autenticação e notificações não fazem parte desta implementação de interface.
- Home ainda contém agendamento ilustrativo; não apresenta agenda real.

## Verificação
- Build Vite e lint executados.
- Não considerar aprovação de build equivalente a validação visual pixel a pixel.
