# Cache de dados das rotas pesadas

Data: 2026-06-04

## Objetivo

Reduzir tempos altos em `application-code` nas rotas `/app/agenda`, `/app/profissionais` e `/app/financeiro`.

## Problema identificado

- Logs do Next indicaram que o tempo estava concentrado no codigo da aplicacao.
- As rotas lentas fazem multiplas consultas Prisma em cada navegacao.
- As rotas simples, como configuracoes e relatorios, responderam rapido.

## Melhorias implementadas

- Criado `src/lib/app-cache.ts` com cache curto de 30 segundos para:
  - dados da agenda;
  - dados de profissionais;
  - dados financeiros com filtros.
- As paginas passaram a usar dados cacheados por `workspaceId`.
- Mutations invalidam o cache relacionado quando alteram dados:
  - agenda;
  - financeiro;
  - profissionais;
  - pacientes;
  - usuarios profissionais;
  - atendimento clinico.

## Arquivos alterados

- `src/lib/app-cache.ts`
- `src/app/app/agenda/page.tsx`
- `src/app/app/agenda/actions.ts`
- `src/app/app/agenda/[id]/atendimento/actions.ts`
- `src/app/app/profissionais/page.tsx`
- `src/app/app/profissionais/actions.ts`
- `src/app/app/financeiro/page.tsx`
- `src/app/app/financeiro/actions.ts`
- `src/app/app/pacientes/actions.ts`
- `src/app/app/configuracoes/usuarios/actions.ts`

## Validacoes executadas

- `npm run lint`: passou.
- `npm run build`: passou.

## Observacao

- A primeira abertura apos invalidacao pode continuar consultando o banco.
- Navegacoes seguintes dentro de 30 segundos devem ser mais rapidas.
- Reiniciar o servidor dev e necessario para testar o novo codigo.
