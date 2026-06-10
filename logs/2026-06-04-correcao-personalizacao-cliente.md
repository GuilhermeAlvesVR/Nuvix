# Correcao da personalizacao por cliente

Data: 2026-06-04

## Problema

A personalizacao por cliente estava salva no workspace, mas nao aparecia de forma clara no painel interno. Partes importantes do layout usavam cores fixas no CSS, principalmente sidebar e header. Alem disso, ao salvar configuracoes, apenas a sessao do usuario atual era invalidada.

## Correcoes aplicadas

- Sidebar do `/app` passa a usar `workspace.primaryColor`.
- Gradiente da sidebar usa `--primary` e `--primary-dark`.
- Header do `/app` passa a ser derivado da cor principal do cliente.
- Hover de botoes/cards no `/app` passa a usar `workspace.accentColor`.
- `--primary-dark` agora e calculado a partir da cor principal do workspace.
- Ao salvar configuracoes, o layout `/app` e revalidado.
- Ao salvar configuracoes, a sessao cacheada de todos os usuarios da empresa e invalidada.

## Arquivos alterados

- `src/app/app/layout.tsx`
- `src/app/app/configuracoes/actions.ts`
- `src/app/globals.css`

## Validacoes executadas

- `npm run lint`: passou.
- `npm run build`: passou.

## Observacao

- A identidade visual do Nuvix nas telas externas permanece separada da personalizacao do cliente no `/app`.
