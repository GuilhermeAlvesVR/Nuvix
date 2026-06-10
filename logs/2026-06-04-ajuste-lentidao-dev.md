# Ajuste de lentidao em navegacao

Data: 2026-06-04

## Objetivo

Reduzir a demora de 4 a 6 segundos ao navegar e salvar dados no app em modo desenvolvimento.

## Problemas identificados

- O Prisma estava configurado para logar todas as queries em desenvolvimento.
- Esse log escreve muito no terminal e pode atrasar cada renderizacao server-side.
- Algumas listas auxiliares nao tinham limite explicito de registros.
- A mensagem `Rendering...` e do Next.js em modo desenvolvimento e aparece durante renderizacoes server-side.

## Melhorias implementadas

- Query log do Prisma foi desligado por padrao.
- Query log agora so liga se `PRISMA_QUERY_LOG=true`.
- Adicionados limites em listas auxiliares:
  - pacientes ativos na agenda: 200;
  - profissionais ativos na agenda: 100;
  - profissionais cadastrados: 100;
  - usuarios profissionais disponiveis: 100;
  - usuarios em configuracoes: 100;
  - pacientes no filtro financeiro: 200.

## Arquivos alterados

- `src/lib/prisma.ts`
- `src/app/app/agenda/page.tsx`
- `src/app/app/profissionais/page.tsx`
- `src/app/app/configuracoes/usuarios/page.tsx`
- `src/app/app/financeiro/page.tsx`

## Validacoes executadas

- `npm run lint`: passou.
- `npm run build`: passou.

## Acao necessaria

- Reiniciar o servidor `npm run dev` para o Prisma Client ser recriado sem log de query.

## Observacao

- Para medir a performance real sem overlay de desenvolvimento, usar `npm run build` e depois `npm run start`.
