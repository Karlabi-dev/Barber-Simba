# Firebase Authentication

Integração inicial com o projeto `barber-simba`, usando o SDK modular. As telas de cadastro e login ainda serão desenhadas; nenhuma rota foi bloqueada nesta etapa.

## Console

Em Authentication, habilite o provedor E-mail/senha. A configuração web fornecida não permite administrar o console ou verificar a habilitação do provedor.

Não é necessário habilitar Firestore, Storage ou Analytics para autenticar.

## Integração das futuras telas

```jsx
import { useAuth } from '../hooks/useAuth'
import { authErrorMessage } from '../services/authErrors'

// Dentro de um componente:
const { usuario, carregando, erroSessao, cadastrar, entrar, sair } = useAuth()

// Dentro dos handlers dos formulários, com estado local de envio/erro:
try {
  await cadastrar(email, senha)
  // Cadastro inicia a sessão automaticamente, conforme o padrão Firebase.
} catch (error) {
  setErro(authErrorMessage(error))
}
// Login: await entrar(email, senha)
// Logout: await sair()
```

- Aguarde `carregando` antes de decidir se o usuário está autenticado.
- Exiba `erroSessao` quando houver falha na inicialização ou no observador.
- Os handlers rejeitam com o erro original do SDK; a tela deve capturá-lo e liberar seu estado de envio em `finally`.
- Não navegue durante a restauração de sessão. Após o sucesso, a futura tela define o destino.
- Senhas não são guardadas pelo código da aplicação. Não registre senha ou tokens no console.
- A sessão usa `browserSessionPersistence`: recarregar a mesma aba mantém a sessão; fechá-la encerra a persistência. Em computador compartilhado, use também o logout.
- A inicialização reutiliza o aplicativo Firebase para evitar duplicação.
- O Provider limpa o observador ao desmontar, inclusive no StrictMode.
- A configuração web é pública e não oferece privilégios administrativos.

## Limites atuais

A interface continua demonstrativa. A saudação e o perfil ainda não consomem o usuário Firebase; isso será feito com as telas. Os agendamentos em sessionStorage não estão associados a um UID nem protegidos por autenticação. Não utilize dados pessoais reais nesse fluxo demonstrativo.

Não há recuperação de senha, verificação de e-mail, regras de banco, envio de notificações ou cadastro de dados adicionais de perfil nesta etapa.

## Verificar

```powershell
npm.cmd install
node --test tests/auth.test.js
npm.cmd run build
npm.cmd run lint
```

Os testes usam funções simuladas do SDK: não criam contas nem acessam o projeto real. O teste real de cadastro/login/logout ficará para quando houver formulário e o provedor estiver habilitado no console.

Documentação: https://firebase.google.com/docs/auth/web/start
