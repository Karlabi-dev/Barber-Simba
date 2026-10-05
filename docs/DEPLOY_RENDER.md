# Publicar o Simba para testes no Render

Este guia prepara uma **homologação**, acessível por uma URL HTTPS em computadores e celulares fora da rede local. O arquivo [`render.yaml`](../render.yaml) cria um único Web Service: a API Express serve o build React e responde a `/api` no mesmo domínio. O serviço gratuito pode demorar a responder depois de ficar ocioso.

## Antes de criar o serviço

- O repositório no GitHub precisa conter `render.yaml` na branch escolhida.
- Use a URL **agrupada (pooler)** da branch de testes `dev-simba-integracao` do Neon em `DATABASE_URL`. Confirme no painel do Neon que esta branch contém as migrações `001` a `005`. Para esta publicação não há migração nova.
- Separe o JSON da conta de serviço do projeto Firebase `barber-simba` para colocá-lo **somente nos arquivos secretos do Render**. Não envie o JSON nem a URL do banco ao GitHub, ao frontend ou a uma conversa.
- Tenha contas de teste distintas para cliente, administrador e profissional vinculado.

## Criar a homologação

1. Acesse [Render Dashboard](https://dashboard.render.com/) e conecte a conta GitHub que tem acesso a `Karlabi-dev/Barber-Simba`.
2. Escolha **New → Blueprint**, selecione o repositório e a branch que contém `render.yaml`.
3. Confira o serviço `simba-homologacao`, tipo **Web Service**, plano **Free**. O Blueprint instala as dependências das pastas `api` e `AppSimba`, gera `AppSimba/dist` e inicia `node api/src/server.js`.
4. Quando Render pedir `DATABASE_URL`, cole apenas a URL **pooler da branch de testes**. Se a URL tiver `sslmode=require`, mantenha-a entre aspas apenas quando for usada num terminal; no campo do Render, cole o valor sem aspas. Não configure `DATABASE_URL_UNPOOLED` no serviço: ela é usada somente nas migrações.
5. Crie o serviço. Em **Environment → Secret Files**, adicione um arquivo chamado `firebase-admin.json` com o conteúdo do JSON de conta de serviço. O Blueprint já define `GOOGLE_APPLICATION_CREDENTIALS=/etc/secrets/firebase-admin.json`. Salve e aguarde o novo deploy.
6. Copie a URL HTTPS exibida pelo Render. Em **Firebase Console → Authentication → Settings → Authorized domains**, adicione somente o domínio gerado, sem `https://` ou caminho. Isso é necessário para fluxos de autenticação que dependem de domínio autorizado.

O Blueprint deixa o deploy automático **desligado**: alterações posteriores na `main` só entram na homologação quando você acionar **Manual Deploy → Deploy latest commit** no Render. Assim uma mudança de código não entra no teste em andamento sem decisão sua.

## Verificar pela URL pública

1. Abra `https://<dominio-render>/api/health`. O retorno esperado é `{ "status": "ok" }`. Se retornar `503`, confira `DATABASE_URL` e os logs do serviço.
2. Abra a URL principal e faça login como cliente. Confira serviços e profissionais, escolha um horário futuro e confirme um agendamento de teste.
3. Abra a mesma URL em outro celular, com uma conta de administrador. Confira agenda, serviços e equipe. Vincular ou retirar acesso de profissional exige o arquivo secreto Firebase válido.
4. Entre com a conta do profissional vinculado e confira se ela abre `/profissional`, vê só a própria agenda e consegue iniciar e finalizar o atendimento de teste.
5. Recarregue diretamente `/admin`, `/profissional/agenda` e `/agendamento` no navegador. As páginas devem abrir sem erro 404; rotas da API inexistentes devem continuar retornando 404 em JSON.

## Configuração e problemas comuns

| Sintoma | Conferência |
| --- | --- |
| Primeira abertura demora | No plano gratuito, o Web Service pode entrar em repouso após inatividade. Aguarde a inicialização. |
| `/api/health` falha | Confira a URL pooler da branch Neon de testes e os logs do serviço. |
| Tela abre, mas catálogo falha | Confira `VITE_USE_NEON=true` no Blueprint e `DATABASE_URL` no Render. Recrie o build se mudar uma variável `VITE_*`. |
| Login ou recuperação de senha falha | Confira o domínio autorizado no Firebase e as configurações da conta de teste. |
| Vínculo de barbeiro falha | Confira o arquivo secreto `firebase-admin.json`, a variável `GOOGLE_APPLICATION_CREDENTIALS` e o projeto Firebase do JSON. |
| Atualizar uma rota mostra 404 | Confira se `SERVE_FRONTEND=true` e se o build de `AppSimba` terminou. |

O endereço público permite testar pelo navegador. Instalação como PWA, notificações reais e avaliações persistidas são etapas separadas. Depois que os testes estiverem corretos, escolha quando e como migrar a hospedagem para dados de produção.
