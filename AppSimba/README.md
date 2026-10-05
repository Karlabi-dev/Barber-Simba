# Barber Simba — frontend

Aplicação React + Vite. O mesmo login Firebase direciona clientes, administradores e barbeiros para suas respectivas áreas. Com `VITE_USE_NEON=true`, catálogo, horários e agendamentos consultam a API em `/api`; o Vite a encaminha para `localhost:3001` no desenvolvimento.

## Executar

Inicie primeiro a API conforme o [guia principal](../README.md). Nesta pasta, copie `.env.example` para `.env.local` e execute:

```powershell
npm.cmd install
npm.cmd run dev
```

Para conferir a compilação e o lint:

```powershell
npm.cmd run build
npm.cmd run lint
```

Sem `VITE_USE_NEON=true`, parte do fluxo funciona no modo de demonstração com dados na sessão do navegador. Com Neon ativo e a migração `006`, as notificações do cliente vêm da API e mantêm o estado de leitura entre dispositivos. Lembretes aparecem no app na véspera e na hora anterior ao atendimento quando ele é aberto; não são mensagens push. Avaliações e notificações do barbeiro continuam informativas. Veja o [estado e as próximas implementações](../docs/STATUS_E_PROXIMOS_PASSOS.md) e os [detalhes da API](../api/README.md).

A [auditoria visual anterior](AUDITORIA.md) registra uma fase inicial da interface e não descreve as integrações atuais.
