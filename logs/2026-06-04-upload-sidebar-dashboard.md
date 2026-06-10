# Upload de logo, sidebar e dashboard operacional

Data: 2026-06-04

## Objetivo

Implementar tres melhorias visuais e operacionais no painel do cliente:

- Upload direto da logo do cliente.
- Sidebar com item ativo, marcadores visuais e rodape de usuario.
- Dashboard inicial com dados reais da empresa.

## Funcionalidades implementadas

### Upload de logo

- Campo `Enviar logo` em `/app/configuracoes`.
- Aceita PNG, JPG e WebP.
- Limite de 2MB.
- Arquivos sao salvos em `public/uploads/workspaces`.
- Ao enviar arquivo, ele substitui a URL manual de logo.
- Continua existindo suporte a URL publica no campo `Logo URL`.

### Sidebar

- Nova navegacao client-side para detectar rota ativa.
- Item ativo recebe destaque visual.
- Cada item tem marcador curto: `IN`, `CL`, `PR`, `AG`, `FI`, `RE`, `CF`.
- Usuario e botao sair foram movidos para o rodape da lateral.
- Header do app agora destaca o atalho de personalizacao.

### Dashboard inicial

- `/app` agora mostra indicadores reais:
  - atendimentos de hoje;
  - pagamentos pendentes;
  - clientes ativos.
- Lista consultas de hoje.
- Lista pendencias financeiras.
- Lista clientes recentes.
- Mantem atalhos principais abaixo do resumo operacional.

## Arquivos alterados

- `src/app/app/app-navigation.tsx`
- `src/app/app/layout.tsx`
- `src/app/app/page.tsx`
- `src/app/app/configuracoes/actions.ts`
- `src/app/app/configuracoes/page.tsx`
- `src/app/globals.css`

## Validacoes executadas

- `npm run lint`: passou.
- `npm run build`: passou.

## Observacoes

- Upload local em `public/uploads` funciona bem no ambiente atual. Em deploy serverless, pode ser necessario trocar para storage persistente no futuro.
- O dashboard respeita o isolamento por `workspaceId`.
