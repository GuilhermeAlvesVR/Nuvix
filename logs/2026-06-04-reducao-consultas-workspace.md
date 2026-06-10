# Reducao de consultas de workspace

Data: 2026-06-04

## Objetivo

Reduzir a demora nas navegacoes do `/app`, especialmente quando o Next exibe "Rendering..." em modo desenvolvimento.

## Problema identificado

- A sessao buscava usuario e status da empresa.
- Em seguida, varias paginas buscavam a mesma empresa novamente com `getWorkspaceById` apenas para montar nome, cores e labels.
- Isso adicionava uma consulta extra ao banco em praticamente toda navegacao dentro do app.

## Melhorias implementadas

- A sessao agora carrega tambem os principais dados do workspace:
  - nome;
  - tipo;
  - logo;
  - cores;
  - labels personalizados.
- O layout e paginas principais passaram a usar `user.workspace` diretamente.
- Removidas chamadas redundantes a `getWorkspaceById` nas rotas do `/app`.

## Arquivos alterados

- `src/lib/session.ts`
- `src/lib/workspace.ts`
- `src/app/app/layout.tsx`
- `src/app/app/page.tsx`
- `src/app/app/agenda/page.tsx`
- `src/app/app/configuracoes/page.tsx`
- `src/app/app/configuracoes/actions.ts`
- `src/app/app/pacientes/page.tsx`
- `src/app/app/pacientes/novo/page.tsx`
- `src/app/app/pacientes/actions.ts`
- `src/app/app/profissionais/page.tsx`

## Validacoes executadas

- `npm run lint`: passou.
- `npm run build`: passou.

## Observacao

- A mensagem "Rendering..." e do Next.js em modo desenvolvimento. Ela nao aparece no modo producao.
- Para sentir a performance real de producao, pare `npm run dev` e rode `npm run build` seguido de `npm run start`.
