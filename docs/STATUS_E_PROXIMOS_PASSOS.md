# Estado do projeto e próximas implementações

Atualizado em 05/10/2026. A homologação está acessível no Render; a implementação dos avisos persistidos do cliente aguarda a migração `006` na branch de testes do Neon e o deploy manual.

Para a visão completa do sistema e os passos de configuração, consulte o [Guia do projeto](GUIA_DO_PROJETO.md).

## Estado confirmado

- Um único app abre as áreas de cliente, administrador e barbeiro de acordo com as permissões da conta Firebase. A API valida os tokens e restringe as operações por usuário e profissional.
- Catálogo, disponibilidade, reservas e histórico reais funcionam com a API e o Neon quando `VITE_USE_NEON=true`.
- O administrador gerencia serviços, equipe, horários e agenda, e pode vincular uma conta Firebase já criada ao profissional.
- O barbeiro vinculado vê os próprios agendamentos e pode passar um atendimento de `confirmado` para `em_atendimento` e depois `concluido`. Não pode cancelar ou excluir.
- O fluxo do barbeiro foi testado manualmente com uma conta e um agendamento reais. A migração `005_professional_accounts.sql` está aplicada em `dev-simba-integracao` e `production`; o SQL Editor na branch `production` confirmou o registro e a tabela `professional_accounts`.
- A homologação está em [simba-homologacao.onrender.com](https://simba-homologacao.onrender.com), com a branch de testes do Neon e os três papéis validados. Os avisos de criação, cancelamento e início próximo para clientes foram implementados no código, mas ainda não foram ativados no ambiente publicado. Avaliações e avisos do barbeiro seguem pendentes.

## Próximas tarefas, na ordem planejada

### 1. [~] Notificações reais

**Objetivo:** substituir os avisos locais de agendamento por notificações persistidas e vinculadas à conta correta.

**Implementado no código:** avisos do cliente quando um agendamento é criado ou cancelado por qualquer papel, lembretes na véspera e na hora anterior, leitura persistida por UID e limite de uma ocorrência por evento. Mensagens externas por e-mail, WhatsApp ou push não estão integradas.

**Pendente:** aplicar `006_customer_notifications.sql` em `dev-simba-integracao`, publicar a nova versão no Render e validar com duas contas. Avisos para o profissional e eventos de iniciar/concluir atendimento ainda não foram implementados.

### 2. [ ] Avaliações reais

**Objetivo:** guardar no banco a avaliação de um atendimento concluído e exibi-la ao cliente e ao profissional correspondente.

**Escopo inicial:** permitir que o cliente dono do agendamento concluído dê uma nota de 1 a 5 estrelas uma única vez; listar avaliações reais no perfil do barbeiro e usar dados calculados onde a interface mostra a nota do profissional. Definir se haverá comentário antes de implementar o formulário.

**Concluído quando:** agendamentos não concluídos ou de outras contas não podem ser avaliados; o mesmo atendimento não gera duas avaliações; a avaliação continua visível em outra sessão e aparece somente para o profissional atendente.

### 3. [x] Publicação de homologação do app e da API

**Objetivo:** permitir acesso ao app fora do computador de desenvolvimento.

**Escopo entregue:** Render hospeda API e frontend no mesmo domínio, conectado à branch `dev-simba-integracao` do Neon para testes. Credenciais Firebase Admin estão em arquivo secreto. A publicação com dados de produção será decidida depois.

**Validado:** login dos três papéis, catálogo, agendamento, agenda, iniciar/finalizar atendimento e acesso por dados móveis; `/api/health` responde `status: ok`.

## Como retomar

1. Atualize a `main` e crie uma branch de código para a próxima tarefa.
2. Desenvolva e teste qualquer migração primeiro em `dev-simba-integracao`. Use a conexão direta `DATABASE_URL_UNPOOLED` para migrar; mantenha `DATABASE_URL` agrupada para consultas da API.
3. Valide o fluxo no app com contas distintas. Migrações para `production` só serão feitas quando houver publicação com dados de produção.
4. Ao concluir, marque a tarefa, registre o que foi entregue e atualize o [README principal](../README.md), o [README do frontend](../AppSimba/README.md) e o [guia da API](../api/README.md).
