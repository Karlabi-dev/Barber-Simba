# Barber Simba

Aplicação web de agendamentos para clientes, administradores e barbeiros. O mesmo login Firebase abre a área correspondente à permissão da conta. O catálogo, a disponibilidade e os agendamentos são atendidos por uma API Node.js com Postgres no Neon quando `VITE_USE_NEON=true`.

**Estado atual:** o fluxo real de agendamento, a gestão administrativa e o atendimento do barbeiro foram testados localmente. A API e o frontend ainda não foram publicados. Notificações e avaliações ainda não são persistidas no banco.

## Tecnologias

| Parte | Tecnologias |
| --- | --- |
| Interface (`AppSimba/`) | React, Vite, React Router e CSS |
| API (`api/`) | Node.js, Express e `pg` |
| Dados | Postgres no Neon, com migrações SQL versionadas |
| Login e permissões | Firebase Authentication e custom claims verificadas pela API |

## Funcionalidades implementadas

| Área | Funcionalidades |
| --- | --- |
| Cliente | Cadastro e login; catálogo de serviços e profissionais; consulta de horários livres; agendamento com escolha de serviço, profissional, data e horário; histórico e cancelamento de reserva confirmada própria. |
| Administrador | Painel e agenda de agendamentos; criação, edição, desativação e exclusão condicionada de serviços e profissionais; horários da equipe; vínculo de uma conta Firebase existente a um barbeiro; início, finalização e cancelamento nos estados permitidos. |
| Barbeiro | Painel, agenda e perfil próprios; consulta dos serviços e horários; início e finalização de atendimentos atribuídos à própria conta. Não pode cancelar ou excluir agendamentos. |

O navegador usa as claims para direcionar a conta; a API verifica a permissão e o vínculo do profissional antes de consultar ou alterar dados. A conta de barbeiro deve ser criada com e-mail e senha próprios e depois vinculada em **Admin → Equipe → Editar profissional → Acesso ao app**. A senha não é entregue ao administrador.

O projeto também conserva um modo de demonstração quando `VITE_USE_NEON` não está ativo. Nesse modo, alguns dados ficam na sessão do navegador e **não** representam reservas compartilhadas entre contas. As notificações do cliente e as avaliações de demonstração também usam armazenamento local; as telas correspondentes do barbeiro informam que ainda não há dados persistidos.

## Executar localmente no Windows

Requisitos: Git, Node.js compatível com as dependências e npm. Os comandos abaixo partem da pasta principal `Barber-Simba`, depois de clonar o repositório. Use **a branch de desenvolvimento do Neon** nas URLs do `api/.env`; a branch `production` já existe para uma futura publicação.

1. Na pasta `api`, crie `.env` a partir de `.env.example`. Preencha `DATABASE_URL` com a URL agrupada (pooler) e `DATABASE_URL_UNPOOLED` com a URL direta **da mesma branch de desenvolvimento**. Não publique esse arquivo.
2. Inicie a API em um terminal PowerShell:

   ```powershell
   cd .\api
   npm.cmd install
   npm.cmd run db:migrate
   npm.cmd run dev
   ```

3. Em outro PowerShell, na pasta `AppSimba`, crie `.env.local` a partir de `.env.example` e mantenha `VITE_USE_NEON=true`. Depois inicie o frontend:

   ```powershell
   cd .\AppSimba
   npm.cmd install
   npm.cmd run dev
   ```

4. Abra o endereço informado pelo Vite. A API responde em `http://localhost:3001/api/health`; o Vite encaminha as chamadas `/api` para ela.

Para **conceder ou retirar acesso de barbeiro**, a API também precisa de uma chave de conta de serviço do mesmo projeto Firebase. Guarde o JSON fora do repositório e defina `GOOGLE_APPLICATION_CREDENTIALS` **no terminal em que iniciar a API**, por exemplo:

```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS = "$env:USERPROFILE\.secrets\barber-simba\firebase-admin.json"
Test-Path $env:GOOGLE_APPLICATION_CREDENTIALS
```

O teste de caminho precisa retornar `True`. O arquivo JSON não deve entrar no Git, no frontend ou em uma mensagem. A configuração web do Firebase no código cliente é diferente dessa chave administrativa.

Se o Vite mostrar `ECONNREFUSED` para `/api`, confira se a API está rodando no outro terminal. No PowerShell, `npm.cmd` evita o bloqueio de `npm.ps1` sem mudar a política de execução.

## Rotas principais

| Área | Caminhos |
| --- | --- |
| Autenticação e cliente | `/login`, `/cadastro`, `/home`, `/servicos`, `/profissionais`, `/agendamento`, `/agendas`, `/perfil` |
| Administração | `/admin`, `/admin/agenda`, `/admin/servicos`, `/admin/equipe` |
| Barbeiro | `/profissional`, `/profissional/agenda`, `/profissional/perfil`, `/profissional/notificacoes` |

As rotas protegidas exigem login e a permissão correspondente. Em futura hospedagem, a aplicação precisa de fallback para `index.html` nas rotas do React Router e de encaminhamento de `/api` ao servidor da API.

## Testes e documentação

```powershell
cd api
npm.cmd test
cd ..\AppSimba
npm.cmd run build
npm.cmd run lint
```

- [Guia completo do projeto](docs/GUIA_DO_PROJETO.md): arquitetura, perfis, fluxos, configuração e limites atuais.
- [Estado atual e próximas implementações](docs/STATUS_E_PROXIMOS_PASSOS.md): notificações reais, avaliações reais e publicação, ainda pendentes.
- [API, migrações e permissões](api/README.md): detalhes do Neon, agendamentos e rotas administrativas e do barbeiro.
- [Autenticação Firebase](AppSimba/FIREBASE_AUTH.md).
- [Auditoria visual anterior](AppSimba/AUDITORIA.md): registro histórico da fase inicial da interface; não descreve o estado atual das integrações.
- [Protótipo no Figma](https://www.figma.com/design/juXMdCvi7DpDtMVkWL6yEL/BarberSimba?node-id=0-1).
