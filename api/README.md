# API e banco do Simba

Catálogo público e agendamentos no Postgres do Neon. A tela de avaliações e as notificações ainda são demonstrações locais.

## Ambientes Neon

Projeto `simba-barber` (`spring-smoke-73415339`), banco `neondb`:

| Branch | Uso | Situação em 30/09/2026 |
| --- | --- | --- |
| `dev-simba-integracao` | Desenvolvimento local e testes | Sem expiração automática; migrações `001` a `005` aplicadas e acesso do barbeiro testado. As URLs desta branch estão no `api/.env` local de desenvolvimento. |
| `production` | Futuro ambiente publicado | Branch padrão; migrações `001` a `005` aplicadas e verificadas no SQL Editor em 30/09/2026. A API ainda não foi publicada. |

Cada branch tem suas próprias URLs de conexão. Não use a URL de `production` no `.env` local ao testar agendamentos e novas telas. O arquivo `.env` contém credenciais e não deve ser enviado ao GitHub.

A disponibilidade exige a migração `003_availability.sql`; a agenda administrativa e o status `em_atendimento` exigem `004_in_progress.sql`. O script `npm.cmd run db:migrate` usa a conexão direta `DATABASE_URL_UNPOOLED`, registra as migrações e não as repete. Confira a branch de destino antes de executar novas migrações.

O acesso do barbeiro exige `005_professional_accounts.sql`, já aplicada nas branches `dev-simba-integracao` e `production`. Em novos ambientes, execute `npm.cmd run db:migrate` a partir de `api` com `DATABASE_URL_UNPOOLED` apontando para a branch correta.

## Configuração local

1. Crie uma branch de desenvolvimento no projeto Neon do Simba e copie suas URLs de conexão.
2. Na pasta `api`, copie `.env.example` para `.env`. Use a URL agrupada em `DATABASE_URL` e a URL direta em `DATABASE_URL_UNPOOLED`.
3. Execute `npm install`, `npm run db:migrate` e `npm run dev` na pasta `api`.
4. Teste `http://localhost:3001/api/health`, `/api/services` e `/api/professionals`.
5. Em outro terminal, na pasta `AppSimba`, copie `.env.example` para `.env.local` e execute `npm install` e `npm run dev`.

No Windows PowerShell, use `npm.cmd` em vez de `npm` se a execução de scripts estiver bloqueada.
O Vite encaminha `/api` para `localhost:3001` no desenvolvimento. Em produção, o servidor que hospedar o frontend também precisa encaminhar `/api` à API.

Sem `VITE_USE_NEON=true`, o app mantém o modo de demonstração. Com a opção ativa, Serviços, Profissionais, Agendamento e Histórico consultam a API. Para agendar, o usuário precisa entrar com Firebase Authentication.

## Agendamentos

- `GET /api/bookings`: lista somente os agendamentos do usuário autenticado.
- `POST /api/bookings`: recebe `serviceSlug`, `professionalSlug`, `data` (AAAA-MM-DD), `horario` (HH:MM) e `observacoes` opcional. Retorna 409 se o profissional já tiver reserva nesse horário.
- `PATCH /api/bookings/:id/cancel`: cancela somente um agendamento confirmado do próprio usuário; não cancela um atendimento já iniciado.
- `GET /api/availability?serviceSlug=corte-premium&professionalSlug=allander&data=2026-10-05`: retorna `{ "data": "2026-10-05", "horarios": ["08:00", "08:30", ...] }` para a data escolhida; não exige login.

As três rotas de `/api/bookings` exigem `Authorization: Bearer <Firebase ID token>`; a disponibilidade é pública. A API verifica assinatura, validade e projeto do token com Firebase Admin (`FIREBASE_PROJECT_ID=barber-simba`); nunca recebe uma senha do Firebase. O horário é interpretado em `America/Fortaleza`. Avaliações e notificações continuam locais e não representam mensagens efetivamente enviadas.

### Disponibilidade e duração

A migração `003_availability.sql` configura inicialmente todos os profissionais de **segunda a sábado, 08:00–18:00**, e atualiza os quatro serviços para **30 minutos**. Os horários de início são gerados a cada 30 minutos (último início às 17:30 para um serviço de 30 minutos). Domingos ficam fechados. Os dias mostrados no catálogo público são calculados a partir da agenda, não do antigo campo ilustrativo `dias`.

Reservas novas precisam começar em um desses intervalos, caber integralmente no expediente e não coincidir com outra reserva confirmada **ou em atendimento** do mesmo profissional. O banco impõe a regra de sobreposição mesmo sob requisições simultâneas. Agendamentos anteriores mantêm sua duração original; por isso, a migração pode falhar se já houver dois agendamentos confirmados que se sobrepõem. Nesse caso, resolva o conflito na branch de desenvolvimento antes de repetir a migração. Com `VITE_USE_NEON=true`, a tela de agendamento consulta os horários livres ao escolher data e profissional; se o horário for ocupado entre a consulta e a confirmação, a API retorna conflito e o cliente pode voltar e escolher outro.

Não envie o arquivo `.env` nem a URL do banco ao GitHub. As migrações usam a conexão direta do Neon; as consultas usam a URL agrupada.

## Painel e API administrativa

O mesmo login do AppSimba abre `/admin` quando o token Firebase contém `admin: true`. O painel mostra resumo e atendimentos reais; `/admin/agenda` filtra dia, semana e mês por profissional e serviço. Os detalhes permitem iniciar um agendamento confirmado, finalizar um atendimento iniciado ou cancelar um agendamento ainda confirmado. As telas `/admin/servicos` e `/admin/equipe` permitem cadastrar, editar, desativar e excluir os registros, além de configurar os horários por dia de cada profissional. A exclusão permanente pede confirmação e só funciona se não houver agendamentos vinculados, inclusive antigos ou cancelados; nesse caso, use Desativar para preservar o histórico. Contas comuns seguem para `/home`. O cadastro da equipe cria o perfil no catálogo, mas ainda não concede login de profissional; essa área está reservada para uma etapa posterior. Novas fotos também exigem uma solução de armazenamento, por isso o formulário usa o avatar padrão.

O nome do cliente passa a ser guardado no momento das **novas** reservas, usando o nome do token Firebase. Reservas feitas antes da migração continuam sem nome salvo; os detalhes mostram o UID verificado da conta para identificá-las, sem inventar um nome. Se você tiver a chave de serviço Firebase Admin no PC, depois de aplicar a migração pode preencher os nomes antigos com `$env:GOOGLE_APPLICATION_CREDENTIALS = "C:\caminho\seguro\firebase-service-account.json"` e `npm.cmd run admin:backfill-names` na pasta `api`. O script só atualiza reservas sem nome e ignora contas sem `displayName`. Os valores atuais de serviços não são apresentados como valor histórico do atendimento.

Todas as rotas `/api/admin/*` exigem `Authorization: Bearer <Firebase ID token>` de uma conta cujo token tenha a **custom claim booleana `admin: true`**. Uma conta autenticada sem essa permissão recebe 403; sem token válido, recebe 401. A permissão é conferida pela API com Firebase Admin, não pelo navegador, e não existe rota HTTP para concedê-la.

| Rota | Função |
| --- | --- |
| `GET /api/admin/dashboard` | Conta agendamentos, aguardando, em atendimento e finalizados no dia atual de Fortaleza. Não calcula faturamento sem registros de pagamento. |
| `GET /api/admin/bookings?status=confirmado&period=upcoming&offset=0` | Lista até 100 agendamentos por página. `status` pode incluir `em_atendimento`; `period` pode ser `today`, `upcoming` ou omitido (histórico). |
| `GET /api/admin/agenda?start=2026-09-28&end=2026-10-05&offset=0` | Lista até 100 reservas por página em intervalo local `[start, end)` de até 32 dias; aceita `professionalId` e `serviceId` opcionais. |
| `GET /api/admin/bookings/:id` | Consulta detalhes do agendamento, incluindo nome salvo do cliente ou UID para reservas antigas. |
| `PATCH /api/admin/bookings/:id/status` | Transições atômicas: `confirmado → em_atendimento → concluido`; `confirmado → cancelado`. Mudança concorrente retorna 409. |
| `GET /api/admin/services` e `GET /api/admin/professionals` | Lista todo o catálogo, inclusive registros inativos. |
| `POST /api/admin/services` e `POST /api/admin/professionals` | Cadastra registros. Serviços exigem `slug`, `nome`, `categoria`, `preco` (texto decimal, por exemplo `"45.00"`) e `duracao` (minutos); profissionais exigem `slug` e `nome`. |
| `PATCH /api/admin/services/:id` e `PATCH /api/admin/professionals/:id` | Atualiza somente os campos enviados. Use `{ "ativo": false }` para retirar do catálogo público sem apagar agendamentos anteriores. |
| `DELETE /api/admin/services/:id` e `DELETE /api/admin/professionals/:id` | Exclui um cadastro sem agendamentos vinculados; retorna 409 se houver histórico, 404 se não existir. Ao excluir um profissional, seus horários semanais também são removidos. |
| `GET /api/admin/professionals/:id/hours` | Consulta os dias e horários configurados para um profissional. |
| `PUT /api/admin/professionals/:id/hours/:weekday` | Define abertura e fechamento de um dia, por exemplo `{ "abertura": "08:00", "fechamento": "18:00" }`. Dias ISO: segunda `1` até domingo `7`. |
| `DELETE /api/admin/professionals/:id/hours/:weekday` | Fecha aquele dia para novos agendamentos; reservas anteriores permanecem registradas. |

Os demais campos aceitos nos serviços são `descricao`, `iconKey`, `ordem` e `ativo`; nos profissionais são `especialidade`, `avaliacao` (texto decimal entre 0 e 5, ou `null`), `imageKey`, `ordem` e `ativo`. `dias` agora é calculado pela agenda semanal. Um profissional novo não recebe horários automaticamente: configure-os pelas rotas acima. `slug` usa letras minúsculas, números e hífens. IDs inválidos e dados fora dos limites retornam 400; `slug` repetido retorna 409.

### Conceder acesso a uma conta escolhida

O responsável pelo projeto deve primeiro obter o **UID** da conta em Firebase Console → Authentication → Users. Em uma máquina confiável, configure `GOOGLE_APPLICATION_CREDENTIALS` com o caminho de uma chave de conta de serviço do **mesmo projeto Firebase** (`FIREBASE_PROJECT_ID`, por padrão `barber-simba`). Com o terminal na pasta `api`, execute:

```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS = "C:\caminho\seguro\firebase-service-account.json"
npm.cmd run admin:claim -- grant UID_DA_CONTA
```

Para retirar a permissão: `npm.cmd run admin:claim -- revoke UID_DA_CONTA`. O script conserva outras custom claims da conta. Não envie a chave ao repositório ou ao navegador. Após uma mudança, a conta deve atualizar o ID token (por exemplo, sair e entrar de novo); tokens já emitidos podem continuar válidos até expirarem. Nenhuma conta recebe acesso administrativo automaticamente ao aplicar este código.

## Acesso e agenda do profissional

O cadastro em **Admin → Equipe** cria o perfil do profissional no catálogo. Para conceder acesso ao app, a pessoa cria uma conta normal em **Cadastro** com seu próprio e-mail e senha. O administrador abre **Equipe → Editar profissional → Acesso ao app** e vincula o e-mail dessa conta ao profissional. A API precisa das credenciais Firebase Admin (`GOOGLE_APPLICATION_CREDENTIALS`) para localizar a conta e atribuir a custom claim `professional: true`; a senha não passa pelo administrador. A pessoa deve sair e entrar novamente para atualizar o token. Um profissional inativo ou sem vínculo no banco recebe 403, mesmo que tenha um token antigo com a claim. O administrador também pode remover o acesso nessa tela antes de excluir o cadastro da equipe.

As rotas `/api/professional/*` exigem token Firebase de uma conta vinculada e ativa. `GET /me`, `/dashboard`, `/bookings?start=AAAA-MM-DD&end=AAAA-MM-DD`, `/hours` e `/services` retornam dados para o painel, agenda e perfil. A consulta de agendamentos fica restrita ao `professional_id` da conta e aceita períodos locais de até 32 dias. `PATCH /bookings/:id/status` permite apenas `confirmado → em_atendimento → concluido` em reservas do próprio profissional; não existem rotas de cancelamento ou exclusão para esse papel. O catálogo de serviços é comum a toda a equipe. Notificações e avaliações do barbeiro ainda não possuem dados persistidos; suas telas informam essa limitação.
