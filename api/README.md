# API e banco do Simba

Catálogo público e agendamentos no Postgres do Neon. A tela de avaliações e as notificações ainda são demonstrações locais.

## Ambientes Neon

Projeto `simba-barber` (`spring-smoke-73415339`), banco `neondb`:

| Branch | Uso | Situação em 30/09/2026 |
| --- | --- | --- |
| `dev-simba-integracao` | Desenvolvimento local e testes | Sem expiração automática; esquema e catálogo aplicados. As URLs desta branch já estão no `api/.env` local de desenvolvimento. |
| `production` | Futuro ambiente publicado | Branch padrão; migrações `001_initial.sql` e `002_seed_catalog.sql` aplicadas em 30/09/2026. São 4 serviços, 8 profissionais e 0 agendamentos. A API ainda não foi publicada. |

Cada branch tem suas próprias URLs de conexão. Não use a URL de `production` no `.env` local ao testar agendamentos e novas telas. O arquivo `.env` contém credenciais e não deve ser enviado ao GitHub.

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

As três rotas exigem `Authorization: Bearer <Firebase ID token>`. A API verifica assinatura, validade e projeto do token com Firebase Admin (`FIREBASE_PROJECT_ID=barber-simba`); nunca recebe uma senha do Firebase. O horário é interpretado em `America/Fortaleza`. Avaliações e notificações continuam locais e não representam mensagens efetivamente enviadas.

Não envie o arquivo `.env` nem a URL do banco ao GitHub. As migrações usam a conexão direta do Neon; as consultas usam a URL agrupada.
