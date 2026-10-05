# Barber Simba | Guia do projeto

**Versão:** 1.1 · **Atualização:** 05/10/2026 · **Situação:** homologação publicada; avisos do cliente aguardam migração e novo deploy

Este guia reúne o funcionamento atual, as decisões de acesso, a configuração do ambiente e as próximas entregas. Ele descreve o código da `main` após a integração da área do barbeiro. O [README principal](../README.md) serve como entrada rápida; o [guia da API](../api/README.md) contém os detalhes das rotas e das migrações.

## 1. Visão geral

O Simba é uma aplicação web de agendamento de barbearia. Cliente, administrador e barbeiro usam o mesmo frontend e o mesmo login Firebase; as permissões da conta determinam a área inicial. A API consulta o Postgres no Neon e verifica as permissões antes de executar operações protegidas.

| Camada | Responsabilidade | Local no repositório |
| --- | --- | --- |
| Frontend React + Vite | Telas, navegação e formulários | `AppSimba/` |
| Firebase Authentication | Login, cadastro, recuperação de senha e tokens | `AppSimba/src/config/firebase.js` |
| API Node.js + Express | Regras de agendamento, catálogo e autorização | `api/src/` |
| Neon Postgres | Serviços, profissionais, horários, reservas e vínculos | `api/migrations/` |

No desenvolvimento, o frontend chama `/api`; o Vite encaminha essas requisições para a API em `localhost:3001`. O navegador não recebe a URL do banco nem o JSON administrativo do Firebase.

### O que já funciona

- Catálogo de serviços e profissionais, disponibilidade por dia e reservas reais quando `VITE_USE_NEON=true`.
- Histórico e cancelamento de reservas confirmadas pelo próprio cliente.
- Painel administrativo, agenda, gestão de serviços e equipe, horários e vínculo de contas de barbeiro.
- Área do barbeiro com painel, agenda e consulta do perfil; início e conclusão dos próprios atendimentos.
- Direcionamento por papel: conta com `admin: true` abre `/admin`; conta vinculada com `professional: true` abre `/profissional`; cliente abre `/home`.

### Limites atuais

A homologação está publicada no Render com a branch de testes do Neon. Os avisos do cliente foram implementados para criação, cancelamento, véspera e hora anterior à reserva; a migração `006` e o novo deploy ainda são necessários para ativá-los na URL pública. Avaliações de demonstração e notificações do barbeiro ainda não são persistidas. Alguns campos adicionais do perfil do cliente também usam armazenamento local. Sem `VITE_USE_NEON=true`, parte do fluxo usa dados de demonstração e não cria reservas compartilhadas.

## 2. Perfis e permissões

| Ação | Cliente | Administrador | Barbeiro vinculado |
| --- | --- | --- | --- |
| Consultar serviços, profissionais e horários | Sim | Sim | Sim |
| Criar e consultar os próprios agendamentos | Sim | Não pela área administrativa | Não pela área profissional |
| Cancelar agendamento | Apenas o próprio confirmado | Confirmado pela agenda administrativa | Não |
| Iniciar e concluir atendimento | Não | Sim, nos estados permitidos | Apenas o próprio atendimento |
| Gerir serviços, equipe e horários | Não | Sim | Consulta dos próprios dados |
| Vincular ou retirar acesso de barbeiro | Não | Sim | Não |

O cadastro de um profissional na equipe cria primeiro seu registro no catálogo. Para abrir a área do barbeiro, a pessoa cria uma conta Firebase própria; o administrador informa o e-mail em **Equipe → Editar profissional → Acesso ao app**. A API atribui a claim profissional e cria o vínculo com o registro ativo no banco. Após vincular, a pessoa sai e entra novamente para atualizar o token. A senha não é compartilhada com o administrador.

A interface usa as claims para escolher a tela, mas a proteção efetiva está na API: cliente acessa apenas suas reservas; barbeiro precisa de claim e vínculo ativo para acessar somente sua agenda; administrador precisa da claim booleana `admin: true` para usar `/api/admin/*`.

## 3. Fluxo de agendamento

| Etapa | Comportamento atual |
| --- | --- |
| Escolha | Cliente seleciona serviço, profissional, data e horário retornado como disponível. |
| Confirmação | A API valida conta, expediente, duração e ocupação; cria a reserva como `confirmado`. |
| Atendimento | Administrador ou barbeiro responsável muda `confirmado` para `em_atendimento`. |
| Conclusão | Atendimento iniciado muda para `concluido`. |
| Cancelamento | Cliente dono ou administrador pode mudar `confirmado` para `cancelado`. |

Reservas `confirmado` e `em_atendimento` mantêm o horário ocupado. O banco também impede sobreposição de reservas concorrentes para o mesmo profissional. Datas e períodos de agenda são interpretados em `America/Fortaleza`. Não há ação de cancelar ou excluir no papel do barbeiro.

## 4. Executar no computador

Use Node.js e npm compatíveis com as dependências. Os exemplos partem da pasta principal `Barber-Simba` em **dois terminais PowerShell**.

### Terminal 1 - API

1. Copie `api/.env.example` para `api/.env`.
2. Preencha `DATABASE_URL` com a conexão **agrupada** e `DATABASE_URL_UNPOOLED` com a conexão **direta** da branch `dev-simba-integracao` do Neon. Mantenha `FIREBASE_PROJECT_ID=barber-simba`.
3. Inicie a API:

```powershell
cd .\api
npm.cmd install
npm.cmd run db:migrate
npm.cmd run dev
```

`http://localhost:3001/api/health` deve responder com `status: ok`. O comando de migração usa a URL direta e não repete arquivos já registrados em `schema_migrations`.

Para vincular/desvincular contas pelo painel, configure também `GOOGLE_APPLICATION_CREDENTIALS` **antes** de `npm.cmd run dev`, apontando para um JSON de conta de serviço do mesmo projeto Firebase, guardado fora do repositório:

```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS = `
  "$env:USERPROFILE\.secrets\barber-simba\firebase-admin.json"
Test-Path $env:GOOGLE_APPLICATION_CREDENTIALS
```

O teste precisa retornar `True`. A variável definida assim vale para aquele terminal; em outro terminal, configure-a novamente antes de iniciar a API. Não envie a chave nem as URLs com senha ao GitHub ou ao navegador.

### Terminal 2 - frontend

1. Copie `AppSimba/.env.example` para `AppSimba/.env.local` e mantenha `VITE_USE_NEON=true`.
2. Inicie o Vite na pasta `AppSimba`:

```powershell
cd .\AppSimba
npm.cmd install
npm.cmd run dev
```

Abra o endereço exibido pelo Vite. Se aparecer `ECONNREFUSED` nas chamadas `/api`, confira se o Terminal 1 continua executando a API na porta 3001. Em PowerShell, `npm.cmd` evita o bloqueio de execução de `npm.ps1`.

## 5. Banco, branches e migrações

| Branch Neon | Finalidade | Estado confirmado em 30/09/2026 |
| --- | --- | --- |
| `dev-simba-integracao` | Desenvolvimento e testes locais | Migrações `001` a `005`; fluxo do barbeiro testado. |
| `production` | Base preparada para publicação futura | Migrações `001` a `005`; o SQL Editor confirmou `005` e `professional_accounts`. |

| Arquivo | Função principal |
| --- | --- |
| `001_initial.sql` | Serviços, profissionais e agendamentos. |
| `002_seed_catalog.sql` | Catálogo inicial. |
| `003_availability.sql` | Horários da equipe, duração e prevenção de sobreposição. |
| `004_in_progress.sql` | Nome salvo do cliente e estado `em_atendimento`. |
| `005_professional_accounts.sql` | Vínculo entre profissional e UID Firebase. |

Uma branch Git e uma branch Neon têm funções diferentes: a primeira versiona o código; a segunda isola dados e migrações. Para uma nova funcionalidade com mudança de banco, valide a migração em `dev-simba-integracao`, teste o fluxo e só depois a aplique em `production` antes de integrar ou publicar código que dependa dela. A aplicação usa a URL agrupada; migrações usam a URL direta.

## 6. Verificação da versão atual

Com a API e o frontend instalados, execute nas respectivas pastas:

```powershell
# Dentro de api
npm.cmd test
# Dentro de AppSimba
npm.cmd run build
npm.cmd run lint
```

Na entrega da área do barbeiro, os 16 testes da API passaram e o build Vite foi concluído. O usuário também validou manualmente uma conta de barbeiro vinculada e o ciclo de um agendamento até a conclusão. A documentação atualizada teve links locais e `git diff --check` conferidos. Esses resultados não substituem um teste no futuro ambiente publicado.

## 7. Próximas implementações

Consulte o [registro de tarefas](STATUS_E_PROXIMOS_PASSOS.md) para o estado mais recente de cada entrega.

### 7.1 Notificações reais

Os avisos do cliente para criação, cancelamento, véspera e hora anterior à reserva estão implementados no código, com leitura persistida e acesso restrito ao UID. É necessário aplicar a migração `006` na branch de testes e fazer o deploy manual. Avisos do barbeiro e eventos de início/conclusão continuam pendentes. E-mail, WhatsApp e push não fazem parte desta versão.

### 7.2 Avaliações reais

Permitir uma avaliação de 1 a 5 estrelas por agendamento concluído, enviada apenas pelo cliente dono da reserva. Guardar a avaliação no banco, apresentá-la ao barbeiro atendente e usar notas calculadas onde a interface mostrar avaliação. A entrega será aceita quando reservas não concluídas ou de outra conta forem rejeitadas e a nota persistir entre sessões. A inclusão de comentário será decidida antes de criar o formulário.

### 7.3 Publicação do app e da API

A homologação em `simba-homologacao.onrender.com` usa a branch de testes do Neon. Os três papéis, as rotas React, a API e `/api/health` foram validados no domínio. A publicação futura com dados da branch `production` será planejada separadamente.

## 8. Como retomar o trabalho

Quando voltarmos ao projeto, comece pelo código mais recente da `main` e abra uma branch específica para a tarefa escolhida. Antes de executar migrações, confira qual branch Neon aparece nas URLs do `api/.env`; não copie credenciais para o frontend. Depois de validar a funcionalidade com contas de teste, registre o resultado e revise a documentação.

```powershell
git switch main
git pull --ff-only origin main
git switch -c feature/nome-da-proxima-etapa
```

| Antes de concluir uma etapa | Conferência |
| --- | --- |
| Banco | Migração testada em `dev-simba-integracao`; versão de `production` aplicada quando necessária. |
| Acesso | Cliente, administrador e barbeiro veem apenas os dados e ações permitidos. |
| Qualidade | Testes da API, build do frontend e fluxo manual da mudança executados. |
| Documentação | Este guia, READMEs e [registro de tarefas](STATUS_E_PROXIMOS_PASSOS.md) refletem o que foi entregue. |

Termos úteis: **UID** é o identificador da conta Firebase; **custom claim** é a permissão adicionada ao token; **URL agrupada** usa o pooler para consultas da aplicação; **URL direta** é usada pelas migrações SQL. A tabela `schema_migrations` do banco registra quais migrações já foram executadas.

## 9. Referências internas

- [README principal](../README.md) - resumo e comandos rápidos.
- [README da API](../api/README.md) - rotas, regras e detalhes das migrações.
- [Guia de Firebase Authentication](../AppSimba/FIREBASE_AUTH.md) - login e recuperação de senha.
- [Registro de status e tarefas](STATUS_E_PROXIMOS_PASSOS.md) - acompanhamento das três próximas etapas.
- [Protótipo no Figma](https://www.figma.com/design/juXMdCvi7DpDtMVkWL6yEL/BarberSimba?node-id=0-1) - referência visual.
