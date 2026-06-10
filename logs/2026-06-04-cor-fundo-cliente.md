# Terceira cor de personalizacao do cliente

Data: 2026-06-04

## Objetivo

Adicionar uma terceira opcao de personalizacao visual para cada cliente: cor de fundo do painel.

## Funcionalidades implementadas

- Novo campo `backgroundColor` no workspace.
- Nova coluna `background_color` na tabela `workspaces`.
- Novo input `Cor de fundo do painel` em `/app/configuracoes`.
- Novo input `Cor de fundo do painel` no cadastro publico de empresa.
- Validacao server-side de hexadecimal para as tres cores.
- Sessao passa a carregar `backgroundColor`.
- Layout `/app` injeta `--workspace-background`.
- CSS do `/app` usa a cor de fundo como base do painel, superficies, inputs, header e callouts.

## Arquivos alterados

- `prisma/schema.prisma`
- `prisma/workspace-background-color-migration.sql`
- `prisma/apply-workspace-background-color-migration.mjs`
- `package.json`
- `src/lib/session.ts`
- `src/app/app/layout.tsx`
- `src/app/app/configuracoes/page.tsx`
- `src/app/app/configuracoes/actions.ts`
- `src/app/cadastro/page.tsx`
- `src/app/cadastro/actions.ts`
- `src/app/globals.css`

## Comando de migracao

- `npm run migrate:workspace-background`

## Validacoes executadas

- `npx prisma validate`: passou.
- `npm run prisma:generate`: passou.
- `npm run migrate:workspace-background`: passou.
- `npm run lint`: passou.
- `npm run build`: passou.

## Observacao

- Foi necessario encerrar processos Node ativos para liberar o Prisma engine no Windows antes de gerar o client.
