# API e banco do Simba

Primeira etapa da integração: catálogo de serviços e profissionais no Postgres do Neon.
Os agendamentos e avaliações do app ainda são dados de demonstração no navegador.

## Configuração local

1. Crie uma branch de desenvolvimento no projeto Neon do Simba e copie suas URLs de conexão.
2. Na pasta `api`, copie `.env.example` para `.env`. Use a URL agrupada em `DATABASE_URL` e a URL direta em `DATABASE_URL_UNPOOLED`.
3. Execute `npm install`, `npm run db:migrate` e `npm run dev` na pasta `api`.
4. Teste `http://localhost:3001/api/health`, `/api/services` e `/api/professionals`.
5. Em outro terminal, na pasta `AppSimba`, copie `.env.example` para `.env.local` e execute `npm install` e `npm run dev`.

No Windows PowerShell, use `npm.cmd` em vez de `npm` se a execução de scripts estiver bloqueada.
O Vite encaminha `/api` para `localhost:3001` no desenvolvimento. Em produção, o servidor que hospedar o frontend também precisa encaminhar `/api` à API.

Sem `VITE_USE_NEON=true`, a tela de Serviços continua com os dados locais de demonstração. Com a opção ativa, ela exibe dados da API e mostra uma mensagem se a conexão falhar. As demais telas ainda usam os dados locais nesta etapa.

Não envie o arquivo `.env` nem a URL do banco ao GitHub. As migrações usam a conexão direta do Neon; as consultas usam a URL agrupada.
