# Estado do projeto e próximas implementações

Atualizado em 01/10/2026. Este documento registra o ponto em que o Simba foi deixado para retomarmos o trabalho; as três tarefas abaixo **ainda não foram implementadas**. Ao concluir cada etapa, atualizaremos este documento e os READMEs conforme o comportamento entregue.

Para a visão completa do sistema e os passos de configuração, consulte o [Guia do projeto](GUIA_DO_PROJETO.md).

## Estado confirmado

- Um único app abre as áreas de cliente, administrador e barbeiro de acordo com as permissões da conta Firebase. A API valida os tokens e restringe as operações por usuário e profissional.
- Catálogo, disponibilidade, reservas e histórico reais funcionam com a API e o Neon quando `VITE_USE_NEON=true`.
- O administrador gerencia serviços, equipe, horários e agenda, e pode vincular uma conta Firebase já criada ao profissional.
- O barbeiro vinculado vê os próprios agendamentos e pode passar um atendimento de `confirmado` para `em_atendimento` e depois `concluido`. Não pode cancelar ou excluir.
- O fluxo do barbeiro foi testado manualmente com uma conta e um agendamento reais. A migração `005_professional_accounts.sql` está aplicada em `dev-simba-integracao` e `production`; o SQL Editor na branch `production` confirmou o registro e a tabela `professional_accounts`.
- A API e o frontend ainda rodam localmente; a aplicação não foi publicada. O [guia de publicação no Render](DEPLOY_RENDER.md) e o Blueprint preparam a homologação, mas a URL pública ainda depende da criação do serviço e da configuração dos segredos. As notificações e avaliações atuais são demonstrações locais ou telas informativas, sem persistência na API.

## Próximas tarefas, na ordem planejada

### 1. [ ] Notificações reais

**Objetivo:** substituir os avisos locais de agendamento por notificações persistidas e vinculadas à conta correta.

**Escopo inicial:** criar avisos dentro do app quando um agendamento for criado, cancelado ou tiver o status alterado; apresentar ao cliente e ao profissional envolvido apenas os próprios avisos; permitir marcar como lidos. Mensagens externas por e-mail, WhatsApp ou push ficam fora desta primeira entrega.

**Concluído quando:** uma conta vê seus avisos após sair e entrar novamente ou usar outro navegador; outra conta não consegue ler nem marcar esses avisos; criar, cancelar, iniciar e concluir um agendamento produzem os eventos previstos sem duplicatas.

### 2. [ ] Avaliações reais

**Objetivo:** guardar no banco a avaliação de um atendimento concluído e exibi-la ao cliente e ao profissional correspondente.

**Escopo inicial:** permitir que o cliente dono do agendamento concluído dê uma nota de 1 a 5 estrelas uma única vez; listar avaliações reais no perfil do barbeiro e usar dados calculados onde a interface mostra a nota do profissional. Definir se haverá comentário antes de implementar o formulário.

**Concluído quando:** agendamentos não concluídos ou de outras contas não podem ser avaliados; o mesmo atendimento não gera duas avaliações; a avaliação continua visível em outra sessão e aparece somente para o profissional atendente.

### 3. [ ] Publicação do app e da API

**Objetivo:** permitir acesso ao app fora do computador de desenvolvimento.

**Escopo inicial:** escolher hospedagem para frontend e API; configurar URLs da branch `production`, variáveis do servidor e credenciais Firebase Admin como segredo; encaminhar `/api` à API, configurar o fallback das rotas da aplicação e verificar as configurações de autenticação no domínio publicado.

**Concluído quando:** login de cada papel, catálogo, criação de agendamento, agenda administrativa e atendimento do barbeiro funcionam pela URL publicada; a API responde ao `/api/health`; nenhum `.env`, URL com senha ou JSON de conta de serviço é enviado ao frontend ou ao repositório.

## Como retomar

1. Atualize a `main` e crie uma branch de código para a próxima tarefa.
2. Desenvolva e teste qualquer migração primeiro em `dev-simba-integracao`. Use a conexão direta `DATABASE_URL_UNPOOLED` para migrar; mantenha `DATABASE_URL` agrupada para consultas da API.
3. Valide o fluxo no app com contas distintas. Depois aplique a migração correspondente em `production` antes de integrar à `main` ou publicar o código que dependa dela.
4. Ao concluir, marque a tarefa, registre o que foi entregue e atualize o [README principal](../README.md), o [README do frontend](../AppSimba/README.md) e o [guia da API](../api/README.md).
