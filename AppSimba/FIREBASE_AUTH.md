# Firebase Authentication

Integração com o projeto `barber-simba`, usando o SDK modular. A rota inicial direciona a conta autenticada para a área de cliente, administrador ou barbeiro segundo as custom claims do token; sem sessão, abre `/login`. A API verifica as permissões novamente nas rotas protegidas.

## Console

Em Authentication, habilite o provedor E-mail/senha. A configuração web fornecida não permite administrar o console ou verificar a habilitação do provedor.

Não é necessário habilitar Firestore, Storage ou Analytics para autenticar.

## Fluxo das telas

- /login: e-mail e senha; sucesso leva à área correspondente à conta.
- /cadastro: nome, e-mail, senha e confirmação. Senhas diferentes não são enviadas ao Firebase.
- Após criar a conta, salva o nome no perfil Firebase e encerra a sessão. Só então mostra o popup "Cadastro confirmado com sucesso".
- OK (ou Escape) fecha o popup e retorna ao login, sem senha preenchida e sem login automático.
- "Esqueceu a senha?" usa o e-mail digitado e solicita recuperação via Firebase, com resposta genérica.
- A marca é exibida diretamente de uma região da imagem de referência fornecida, sem redesenhar a coroa.

## API dos componentes

```jsx
import { useAuth } from '../hooks/useAuth'
import { authErrorMessage } from '../services/authErrors'

// Dentro de um componente:
const { usuario, papel, carregando, erroSessao, cadastrar, entrar, sair } = useAuth()

// Dentro dos handlers dos formulários, com estado local de envio/erro:
try {
  await cadastrar(email, senha, nome)
  // O serviço encerra a sessão antes de retornar sucesso.
} catch (error) {
  setErro(authErrorMessage(error))
}
// Login: await entrar(email, senha)
// Logout: await sair()
```

- Aguarde `carregando` antes de decidir se o usuário está autenticado.
- Exiba `erroSessao` quando houver falha na inicialização ou no observador.
- Os handlers rejeitam com o erro original do SDK; a tela deve capturá-lo e liberar seu estado de envio em `finally`.
- Não navegue durante a restauração de sessão.
- Senhas não são guardadas pelo código da aplicação. Não registre senha ou tokens no console.
- A sessão usa `browserSessionPersistence`: recarregar a mesma aba mantém a sessão; fechá-la encerra a persistência. Em computador compartilhado, use também o logout.
- A inicialização reutiliza o aplicativo Firebase para evitar duplicação.
- O Provider limpa o observador ao desmontar, inclusive no StrictMode.
- A configuração web é pública e não oferece privilégios administrativos.

## Limites atuais

Com `VITE_USE_NEON=true`, agendamentos são associados ao UID Firebase e consultados pela API; nome e e-mail do Firebase aparecem nas telas correspondentes. Parte dos campos adicionais do perfil ainda usa armazenamento local. Sem essa opção, o fluxo demonstrativo grava dados na sessão do navegador e não produz uma reserva real.

Há recuperação de senha e gravação do nome no perfil Auth. O código atual não envia e-mail de verificação de cadastro. Notificações e avaliações ainda não são persistidas pela API. O acesso de barbeiro é concedido pelo administrador a uma conta já existente; a claim `admin: true` continua a ser concedida apenas pelo script local protegido.

## Verificar

```powershell
npm.cmd install
node --test tests/auth.test.js
npm.cmd run build
npm.cmd run lint
```

Os testes locais usam funções simuladas do SDK e incluem a sequência criar conta → salvar nome → logout. Não criam contas nem acessam o projeto real. O fluxo com contas de administrador e barbeiro também foi validado manualmente pelo usuário.

Documentação: https://firebase.google.com/docs/auth/web/start
# Recuperação com telas do Simba

- `/esqueci-senha`: envio do e-mail, acessível pelo login.
- `/atualizar-senha?mode=resetPassword&oobCode=...`: valida o código recebido por e-mail e confirma a nova senha.
- O popup “Senha redefinida com sucesso!” só abre após o Firebase confirmar a troca; OK retorna ao login, sem login automático.
- Links inválidos, expirados ou usados exibem erro e opção de solicitar outro link.

## Configuração necessária no console

Em **Authentication → Templates (Modelos) → Password reset (Redefinição de senha)**, edite o modelo e use **Customize action URL (Personalizar URL de ação)**. Informe o endereço público do app terminado em `/atualizar-senha`. O Firebase acrescenta `mode` e `oobCode` ao link automaticamente. O servidor deve servir o app React também ao abrir essa rota diretamente.

Para teste apenas no mesmo PC com Vite rodando, pode usar `http://localhost:5173/atualizar-senha` e abrir o e-mail nesse PC. Confirme a porta exibida pelo Vite. Antes de disponibilizar o app, substitua pelo endereço HTTPS publicado. Essa configuração do console não foi alterada por este PR. Sem ela, o e-mail continua abrindo a página padrão do Firebase.

Fonte: https://firebase.google.com/docs/auth/custom-email-handler

Teste manual: solicitar recuperação, abrir o link, conferir senhas diferentes, confirmar uma senha válida, fechar popup, entrar com a nova senha e tentar reutilizar o link. Build, lint e testes locais não substituem este teste com um e-mail real.
