# API e banco do Simba

Catálogo público e agendamentos no Postgres do Neon. A tela de avaliações e as notificações ainda são demonstrações locais.

## Ambientes Neon

Projeto `simba-barber` (`spring-smoke-73415339`), banco `neondb`:

| Branch | Uso | Situação em 30/09/2026 |
| --- | --- | --- |
| `dev-simba-integracao` | Desenvolvimento local e testes | Sem expiração automática; migrações `001`, `002` e `003_availability.sql` aplicadas. São 4 serviços de 30 minutos e 48 períodos semanais para 8 profissionais. As URLs desta branch já estão no `api/.env` local de desenvolvimento. |
| `production` | Futuro ambiente publicado | Branch padrão; apenas as migrações `001_initial.sql` e `002_seed_catalog.sql` estão aplicadas. São 4 serviços, 8 profissionais e 0 agendamentos. **A migração `003` ainda não foi aplicada**; a API ainda não foi publicada. |

Cada branch tem suas próprias URLs de conexão. Não use a URL de `production` no `.env` local ao testar agendamentos e novas telas. O arquivo `.env` contém credenciais e não deve ser enviado ao GitHub.

O código da API com disponibilidade exige a migração `003` antes de atender agendamentos. Na `production`, aplique essa migração com a conexão direta somente após a autorização da mudança nesse ambiente.

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
- `PATCH /api/bookings/:id/cancel`: cancela somente um agendamento confirmado do próprio usuário.
- `GET /api/availability?serviceSlug=corte-premium&professionalSlug=allander&data=2026-10-05`: retorna `{ "data": "2026-10-05", "horarios": ["08:00", "08:30", ...] }` para a data escolhida; não exige login.

As três rotas de `/api/bookings` exigem `Authorization: Bearer <Firebase ID token>`; a disponibilidade é pública. A API verifica assinatura, validade e projeto do token com Firebase Admin (`FIREBASE_PROJECT_ID=barber-simba`); nunca recebe uma senha do Firebase. O horário é interpretado em `America/Fortaleza`. Avaliações e notificações continuam locais e não representam mensagens efetivamente enviadas.

### Disponibilidade e duração

A migração `003_availability.sql` configura inicialmente todos os profissionais de **segunda a sábado, 08:00–18:00**, e atualiza os quatro serviços para **30 minutos**. Os horários de início são gerados a cada 30 minutos (último início às 17:30 para um serviço de 30 minutos). Domingos ficam fechados. Os dias mostrados no catálogo público são calculados a partir da agenda, não do antigo campo ilustrativo `dias`.

Reservas novas precisam começar em um desses intervalos, caber integralmente no expediente e não coincidir com outra reserva confirmada do mesmo profissional. O banco impõe a regra de sobreposição mesmo sob requisições simultâneas. Agendamentos anteriores mantêm sua duração original; por isso, a migração pode falhar se já houver dois agendamentos confirmados que se sobrepõem. Nesse caso, resolva o conflito na branch de desenvolvimento antes de repetir a migração. Com `VITE_USE_NEON=true`, a tela de agendamento consulta os horários livres ao escolher data e profissional; se o horário for ocupado entre a consulta e a confirmação, a API retorna conflito e o cliente pode voltar e escolher outro.

Não envie o arquivo `.env` nem a URL do banco ao GitHub. As migrações usam a conexão direta do Neon; as consultas usam a URL agrupada.

## Painel e API administrativa

O mesmo login do AppSimba abre `/admin` quando o token Firebase contém `admin: true`. O painel inicial mostra o resumo de hoje e os atendimentos de hoje, futuros e do histórico. As telas `/admin/servicos` e `/admin/equipe` permitem cadastrar, editar e desativar os registros, além de configurar os horários por dia de cada profissional. Contas comuns seguem para `/home`. O cadastro da equipe cria o perfil no catálogo, mas ainda não concede login de profissional; essa área está reservada para uma etapa posterior. Novas fotos também exigem uma solução de armazenamento, por isso o formulário usa o avatar padrão.

Todas as rotas `/api/admin/*` exigem `Authorization: Bearer <Firebase ID token>` de uma conta cujo token tenha a **custom claim booleana `admin: true`**. Uma conta autenticada sem essa permissão recebe 403; sem token válido, recebe 401. A permissão é conferida pela API com Firebase Admin, não pelo navegador, e não existe rota HTTP para concedê-la.

| Rota | Função |
| --- | --- |
| `GET /api/admin/dashboard` | Conta agendamentos, aguardando e finalizados no dia atual de Fortaleza. Não calcula faturamento sem registros de pagamento. |
| `GET /api/admin/bookings?status=confirmado&period=upcoming&offset=0` | Lista até 100 agendamentos por página, incluindo `firebaseUid`; `status` pode ser omitido ou ser `confirmado`, `concluido`, `cancelado`. `period` pode ser `today`, `upcoming` ou omitido (histórico). |
| `PATCH /api/admin/bookings/:id/status` | Recebe `{ "status": "concluido" }` ou `{ "status": "cancelado" }`, somente se o agendamento estiver confirmado. |
| `GET /api/admin/services` e `GET /api/admin/professionals` | Lista todo o catálogo, inclusive registros inativos. |
| `POST /api/admin/services` e `POST /api/admin/professionals` | Cadastra registros. Serviços exigem `slug`, `nome`, `categoria`, `preco` (texto decimal, por exemplo `"45.00"`) e `duracao` (minutos); profissionais exigem `slug` e `nome`. |
| `PATCH /api/admin/services/:id` e `PATCH /api/admin/professionals/:id` | Atualiza somente os campos enviados. Use `{ "ativo": false }` para retirar do catálogo público sem apagar agendamentos anteriores. |
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
