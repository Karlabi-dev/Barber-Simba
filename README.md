# Barber Simba

Interface web de uma barbearia, com catálogo de serviços, profissionais e fluxo de agendamento demonstrativo. Projeto em desenvolvimento, baseado no protótipo do Figma.

> Etapa atual: interface e navegação implementadas, com fluxo de agendamento testado manualmente. Não realiza reservas reais nem envia notificações.

## Tecnologias

| Tecnologia | Aplicação |
| --- | --- |
| React JS | Interface e componentes reutilizáveis |
| Vite | Desenvolvimento e build |
| React Router | Navegação entre telas |
| CSS | Identidade visual e responsividade |
| Git + GitHub | Versionamento e colaboração |

## Funcionalidades

- Tela de carregamento e Home com destaques.
- Busca de profissionais, incluindo Allander com a foto fornecida.
- Catálogo com busca e filtros Todos, Cabelo, Barba e Combos.
- Seleção de serviço, profissional, data, horário e observações.
- Revisão, edição e confirmação demonstrativa do agendamento.
- Preservação dos dados em `sessionStorage` na sessão do navegador.
- Tema escuro com destaques dourados e ações em vermelho.
- Página provisória de perfil, identificada como demonstração.

A Home ainda apresenta um agendamento ilustrativo. Não há consulta de disponibilidade real, backend ou banco de dados de agendamentos.

## Firebase Authentication

A base de cadastro por e-mail/senha, login, logout e observação da sessão está integrada ao React. As telas ainda serão criadas, e as rotas demonstrativas continuam públicas. Configuração: projeto Firebase `barber-simba`.

Consulte o [guia de integração](AppSimba/FIREBASE_AUTH.md) para habilitar o provedor, conectar as futuras telas e entender a persistência de sessão. Os testes atuais simulam o SDK e não confirmam acesso ao Firebase real.

## Executar localmente

Requisitos: Git, Node.js compatível com as dependências do projeto e npm.

```bash
git clone https://github.com/Karlabi-dev/Barber-Simba.git
cd Barber-Simba/AppSimba
npm install
npm run dev
```

Abra o endereço informado pelo Vite no terminal.

No PowerShell, se a execução de `npm.ps1` estiver bloqueada, use:

```powershell
npm.cmd install
npm.cmd run dev
```

Não é necessário alterar a política de execução do Windows.

## Comandos

Execute dentro da pasta `AppSimba`.

| Comando | Finalidade |
| --- | --- |
| `npm run dev` | Iniciar servidor de desenvolvimento |
| `npm run build` | Gerar build em `dist` |
| `npm run preview` | Visualizar o build localmente |
| `npm run lint` | Verificar código com Oxlint |

## Organização

- `AppSimba/src/pages/`: telas.
- `AppSimba/src/components/`: componentes compartilhados.
- `AppSimba/src/data/`: dados demonstrativos e armazenamento do agendamento.
- `AppSimba/src/assets/`: imagens e ícones.
- `AppSimba/src/App.jsx`: rotas.
- `AppSimba/src/App.css` e `index.css`: estilos.
- [Auditoria e pendências](AppSimba/AUDITORIA.md).

## Rotas

| Caminho | Tela |
| --- | --- |
| `/` | Redirecionamento para carregamento |
| `/loading` | Carregamento |
| `/home` | Home |
| `/profissionais` | Lista de profissionais |
| `/servicos` | Catálogo |
| `/agendamento` | Formulário |
| `/confirmar-agendamento` | Revisão |
| `/agendamento-confirmado` | Confirmação demonstrativa |
| `/perfil` | Perfil provisório |

Em uma futura hospedagem, configure o fallback das rotas para `index.html`, pois a aplicação utiliza BrowserRouter.

## Validação desta etapa

- Build do Vite e lint executados sem erros.
- Armazenamento de agendamento verificado com dados vazios, válidos e inválidos.
- Fluxo de agendamento testado manualmente pelo usuário.
- Fidelidade visual completa e testes automatizados de navegador ainda pendentes.

## Pendências

- Fotos dos demais profissionais, banner e ícones originais.
- Finalização visual conforme os recursos exportados do Figma.
- Definição da tela de perfil.
- Telas de autenticação conectadas ao Firebase e teste real de cadastro/login/logout.
- Integrações de disponibilidade, reservas e notificações, caso sejam incluídas no escopo futuro.

As imagens provisórias não representam uma implementação visual definitiva. Nenhum WhatsApp ou e-mail é enviado pela aplicação.

## Referência visual

[Protótipo BarberSimba no Figma](https://www.figma.com/design/juXMdCvi7DpDtMVkWL6yEL/BarberSimba?node-id=0-1)

## Problema de atualização no Windows

Versões antigas continham `button.jsx` e `Button.jsx`. A versão atual mantém apenas `Button.jsx`. Se, após atualizar uma cópia antiga, o Vite não encontrar esse componente, primeiro confira suas alterações com `git status`. Se não houver alterações próprias a preservar nesse arquivo, recupere a cópia versionada, dentro de `AppSimba`:

```powershell
git restore --source=HEAD --worktree -- src/components/Button.jsx
```

Reinicie o servidor. Não aplique backups antigos automaticamente sem revisar possíveis conflitos.
