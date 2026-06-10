# Ajustes de performance

Data: 2026-06-04

## Objetivo

Reduzir lentidao ao abrir telas e salvar dados, principalmente nas areas de agenda, financeiro, pacientes, profissionais e usuarios.

## Problemas identificados

- Consultas recentes passaram a filtrar por `workspaceId`, status, data, paciente, profissional e financeiro.
- O banco ainda nao tinha indices especificos para esses filtros novos.
- O registro de pagamento somava pagamentos confirmados carregando linhas em memoria, em vez de usar agregacao no banco.
- Arquivos temporarios de debug haviam sido criados durante a investigacao e foram removidos.

## Melhorias implementadas

- Adicionados indices no `prisma/schema.prisma` para:
  - usuarios por empresa, perfil e status;
  - pacientes ativos por empresa e nome;
  - profissionais ativos por empresa e nome;
  - consultas por empresa, data e status financeiro;
  - pagamentos por empresa, status, data, paciente e consulta.
- Criado `prisma/performance-indexes.sql`.
- Criado `prisma/apply-performance-indexes.mjs`.
- Adicionado comando `npm run migrate:performance`.
- Aplicados os indices no banco atual com sucesso.
- Otimizado `src/app/app/financeiro/actions.ts` para usar `aggregate` do Prisma ao recalcular pagamentos confirmados.
- Restaurado `src/lib/session.ts` apos escrita parcial interrompida.

## Arquivos alterados

- `package.json`
- `prisma/schema.prisma`
- `prisma/performance-indexes.sql`
- `prisma/apply-performance-indexes.mjs`
- `src/app/app/financeiro/actions.ts`
- `src/lib/session.ts`

## Validacoes executadas

- `npx prisma validate`: passou.
- `npm run migrate:performance`: passou.
- `npm run lint`: passou.
- `npm run build`: passou.

## Observacao

- `npm run prisma:generate` falhou com `EPERM` no Windows porque o arquivo do Prisma Client parecia estar em uso, provavelmente pelo servidor `npm run dev`. Para regenerar depois, pare o servidor dev e rode `npm run prisma:generate` novamente.

## Pendencias conhecidas

- Se ainda houver lentidao perceptivel, medir quais telas continuam lentas e otimizar consultas especificas com limites/filtros adicionais.
